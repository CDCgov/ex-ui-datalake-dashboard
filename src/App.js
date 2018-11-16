import React, { Component } from 'react';
import $ from 'jquery';
import moment from 'moment';
import {
  SuperTable, SuperGrid, SearchBar, Pane, DataLayers, IconButton,
  Navbar, OptionView, OptionExport, DataEndpoint, DropdownUser,
  DropdownDownloads, OptionPageLimit, PaneHistory, Loader
} from 'fdns-ui-react';
import {Pagination} from '@react-bootstrap/pagination';
import swal from 'sweetalert2';
import PouchDB from 'pouchdb';
import './App.css';
import AdminModal from './AdminModal';
import logo from './logo.svg';
import defaultHeaders from './data/headers.json';
import { API, secureMode } from './defaults';
const imgDataLayers = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5cHgiIGhlaWdodD0iMTlweCIgdmlld0JveD0iMCAwIDE5IDE5IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0MiAoMzY3ODEpIC0gaHR0cDovL3d3dy5ib2hlbWlhbmNvZGluZy5jb20vc2tldGNoIC0tPgogICAgPHRpdGxlPmljby1kYXRhTGF5ZXJzPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+PC9kZWZzPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImFwcC1kZXNrdG9wLWxpc3QtbmV3IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc2MS4wMDAwMDAsIC0yMTMuMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSJHcm91cC0yOCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTc0Ni4wMDAwMDAsIDIwNi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxnIGlkPSJpY28tZGF0YUxheWVycyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuMDAwMDAwLCA3LjAwMDAwMCkiPgogICAgICAgICAgICAgICAgICAgIDxnIGlkPSJfeDMzX19MYXllcnNfMV8iPgogICAgICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iX3gzM19fTGF5ZXJzIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJMYXllcnNfMyIgZmlsbD0iIzFFNDA4QSIgcG9pbnRzPSIxOSAxNC4yNSA5LjUgOS41IDAgMTQuMjUgOS41IDE5Ij48L3BvbHlnb24+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cG9seWdvbiBpZD0iTGF5ZXJzXzIiIGZpbGw9IiNGRjQwODEiIHBvaW50cz0iMTkgOS41IDkuNSA0Ljc1IDAgOS41IDkuNSAxNC4yNSI+PC9wb2x5Z29uPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBvbHlnb24gaWQ9IkxheWVyc18xIiBmaWxsPSIjQUI3MkMxIiBwb2ludHM9IjE5IDQuNzUgOS41IDAgMCA0Ljc1IDkuNSA5LjUiPjwvcG9seWdvbj4KICAgICAgICAgICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';
const indexingDB = new PouchDB('local/fdns-ms-indexing');
const reportingDB = new PouchDB('local/common-ms-reporting');

window.indexingDB = indexingDB;
window.reportingDB = reportingDB;
window.moment = moment;

class App extends Component {

  // init
  constructor(props) {
    super(props);

    const defaults = this.setDefaults();
    const { activeLimit, headers, layoutSelected } = defaults;
    const pageLimits = [10, 25, 50, 100];

    this.state = {
      pageLimits,
      pageDefaultLimitIndex: pageLimits.indexOf(activeLimit),
      dataLength: 0,
      activePageNo: 1,
      activeData: [],
      activeLimit,
      headers,
      searching: '',
      loading: true,
      layoutSelected,
      dataLayersActive: false,
      showHistory: true,
      downloads: [],
      history: {},
      historyMainSubtitle: '0 Results',
      defaultUser: {
        "firstName": "First",
        "lastName": "Last",
        "email": "abc1@my.org",
        "avatar": "http://placehold.it/80x80.png",
        "org": "ABC/DEF/XYZ",
      },
      user: {},
      showAdmin: false,
    }
  }

  componentWillMount() {
    const { activeLimit } = this.state;
    this.updateActiveData(1, activeLimit);
    this.pollDownloadsInterval = setInterval(this.pollDownloads, 1000);
    this.setHistory();
    this.setSearching();
    this.setDownloads();
    if (secureMode) this.setUser();
  }

  componentWillUnmount() {
    if (this.serverRequest) this.serverRequest.abort();
    clearInterval(this.pollDownloadsInterval);
  }

  get(url) {
    return new Promise((resolve, reject) => {
      this.serverRequest = $.ajax({
        url: url,
        type: 'GET',
        success: (res) => {
          resolve(res);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  post(url, data = {}) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        type: 'POST',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: (res) => {
          resolve(res);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  // set user
  setUser = () => {
    this.get(`${API.identity}/user`).then((res) => {
      if (res.properties) {
        this.setState({
          user: res.properties,
        });
      }
    }).catch((err) => {
      window.forceLogin();
    });
  }

  // set searching on page load
  setSearching = () => {
    const { hash } = window.location;
    const { activePageNo, activeLimit } = this.state;

    if (hash.includes('#/')) {
      const searching = hash.replace('#/', '');

      this.setState({
        showHistory: false,
        searching,
        loading: true,
      }, () => {
        this.updateActiveData(activePageNo, activeLimit);
      });
    }
  }

  // set downloads
  setDownloads = () => {
    reportingDB.allDocs({
      include_docs: true,
    }).then((res) => {
      const downloads = res.rows.map((row) => {
        return row.doc;
      });

      this.setState({
        downloads,
      });
    }).catch((err) => {
      throw err;
    });
  }

  // setup indexing history
  setHistory = () => {
    let history = {};

    indexingDB.allDocs({
      include_docs: true,
    }).then((res) => {
      const dateFormat = 'MMMM Do YYYY';
      const today = moment().format(dateFormat);
      const yesterday = moment().subtract(1, 'days').format(dateFormat);

      res.rows.sort((a, b) => {
        const aSort = new Date(a.doc.date);
        const bSort = new Date(b.doc.date);

        if (aSort > bSort) return -1;
        if (aSort < bSort) return 1;
        return 0;
      }).forEach((row) => {
        const { doc } = row;
        const { query, date } = doc;
        const day = moment(date).format(dateFormat);
        const item = {
          title: query,
          subtitle: '0 Results',
        };
        let title = day;

        // set the title to yesterday or today if needed
        if (day === today) {
          title = 'Today';
        } else if (day === yesterday) {
          title = 'Yesterday';
        }

        // add to the history
        if (history[title] !== undefined) {
          history[title].push(item);
        } else {
          history[title] = [item];
        }
      });

      this.setState({
        history,
      }, () => {
        this.updateHistoryTotals();
      });
    }).catch((err) => {
      throw err;
    });
  }

  // set localStorage values
  setDefaults() {
    const defaults = {
      headers: defaultHeaders,
      layoutSelected: 'super-table',
      activeLimit: 25,
    };

    // only override defaults if localStorage
    if (window.localStorage) {
      const headers = JSON.parse(window.localStorage.getItem('headers'));
      const layoutSelected = JSON.parse(window.localStorage.getItem('layoutSelected'));
      const activeLimit = JSON.parse(window.localStorage.getItem('activeLimit'));

      // set defaults
      if (headers !== null) defaults.headers = headers;
      if (layoutSelected !== null) defaults.layoutSelected = layoutSelected;
      if (activeLimit !== null) defaults.activeLimit = activeLimit;
    }

    return defaults;
  }

  // poll downloads every second
  pollDownloads = () => {
    const { downloads } = this.state;
    if (downloads.length === 0) return;

    downloads.forEach((download, downloadIndex) => {
      if (download.status === 'RUNNING') {
        const url = `${API.reporting}/jobs/${download._id}`;

        // poll the job
        this.get(url).then((res) => {
          reportingDB.get(res._id).then((doc) => {
            reportingDB.put(Object.assign(doc, res));
          });

          this.setState({
            downloads: this.state.downloads.map((download, index) => {
              if (index === downloadIndex) return res;
              return download;
            }),
          });
        });
      }
    });
  }

  // update history totals
  updateHistoryTotals = () => {
    const nextHistory = Object.assign({}, this.state.history);

    Object.keys(nextHistory).forEach((groupName) => {
      const group = nextHistory[groupName];
      group.forEach((item, itemIndex) => {
        this.post(`${API.objectCount}&qs=${item.title}`).then((res) => {
          // update the subtitle with the result total
          nextHistory[groupName][itemIndex].subtitle = `${res.total} Results`;
          this.setState({
            history: nextHistory,
          });
        }).catch((err) => {
          this.setState({
            loading: false,
          }, () => {
            swal('Error', 'There is an issue connecting to the server.', 'error');
          });
        });
      });
    });
  }

  // update active data
  updateActiveData = (activePageNo, activeLimit) => {
    const { searching } = this.state;
    const from = (activePageNo - 1) * activeLimit;
    // const to = Math.max(start + activeLimit);
    // const dataLength = data.length;
    // const activeData = data.slice(from, to);

    this.post(`${API.objectSearch}?size=${activeLimit}&from=${from}&qs=${searching}`).then((res) => {
      const activeData = res.items;
      const dataLength = res.total;

      const nextData = {
        dataLength,
        activePageNo,
        activeData,
        activeLimit,
        loading: false,
      };

      // update main subtitle if we're searching main
      if (searching === '') nextData.historyMainSubtitle = `${dataLength} Results`;

      this.setState(nextData);
    }).catch((err) => {
      this.setState({
        loading: false,
      }, () => {
        swal('Error', 'There is an issue connecting to the server.', 'error');
      });
    });
  }

  // search event
  handleSearch = (query) => {
    const { activePageNo, activeLimit } = this.state;
    const date = new Date();

    indexingDB.put({
      _id: `${date.getTime()}`,
      date,
      query,
    }).then((res) => {
      this.setHistory();
    }).catch((err) => {
      throw err;
    });

    window.location.hash = `#/${query}`;

    this.setState({
      searching: query,
      showHistory: false,
      loading: true,
    }, () => {
      $('.search-bar form.search-form input').blur();
      this.updateActiveData(activePageNo, activeLimit);
    });
  }

  // close active pane
  handleActivePaneCollapse = () => {
    window.location.hash = '';

    this.setState({
      searching: '',
      showHistory: true,
    });
  }

  // activate data layers
  handleDataLayersActive = () => {
    const { dataLayersActive } = this.state;

    this.setState({
      dataLayersActive: !dataLayersActive,
    });
  }

  // handle data layers save
  handleDataLayersSave = (headers) => {
    // save to local storage
    if (window.localStorage) window.localStorage.setItem('headers', JSON.stringify(headers));

    this.setState({
      headers,
      dataLayersActive: false,
    });
  }

  // called when an option view is changed
  handleOptionViewChange = (layoutSelected) => {
    // save to local storage
    if (window.localStorage) window.localStorage.setItem('layoutSelected', JSON.stringify(layoutSelected));

    this.setState({
      layoutSelected
    });
  }

  // called when the pagination is called
  handlePageSelect = (activePageNo) => {
    const { activeLimit } = this.state;

    this.setState({
      loading: true,
    }, () => {
      this.updateActiveData(activePageNo, activeLimit);
    });
  }

  // called when the page limit option is changed
  handlePageLimitChange = (activeLimit) => {
    const { activePageNo } = this.state;

    // save to local storage
    if (window.localStorage) window.localStorage.setItem('activeLimit', JSON.stringify(activeLimit));

    this.setState({
      loading: true,
    }, () => {
      this.updateActiveData(activePageNo, activeLimit);
    });
  }

  // called when the pane history is collapse
  handleHistoryCollapse = (groupIndex, itemIndex) => {
    const { history, activePageNo, activeLimit } = this.state;

    let searching = '';

    if ((groupIndex >= 0) && (itemIndex >= 0)) {
      const group = history[Object.keys(history)[groupIndex]];
      const item = group[itemIndex];

      searching = item.title;
    }

    window.location.hash = `#/${searching}`;

    this.setState({
      showHistory: false,
      searching,
      loading: true,
    }, () => {
      this.updateActiveData(activePageNo, activeLimit);
    });
  }

  // called when the pane history is reset
  handleHistoryReset = () => {
    this.setState({
      history: {},
    }, () => {
      indexingDB.allDocs({
        include_docs: true,
      }).then((res) => {
        res.rows.forEach((row) => {
          indexingDB.remove(row.doc);
        });
      }).catch((err) => {
        throw err;
      });
    });
  }

  // handle the option export
  handleOptionExport = (format) => {
    const { searching, headers, downloads } = this.state;
    const { index } = API;

    // setup the data object
    const data = {
      query: searching,
      format,
      index,
    };

    // add mapping for XLSX and CSV
    if ((format === 'xlsx') || (format === 'csv')) {
      // create mapping
      const mapping = [];
      headers.forEach((header) => {
        if (header.visible) {
          const { path, label } = header;
          mapping.push({
            path: path.replace('$.', ''),
            label,
          });
        }
      });

      // add to data
      data.mapping = mapping;
    }

    const url = `${API.reporting}/jobs`;

    // send the job to the downloads microservice
    this.post(url, data).then((res) => {
      reportingDB.put(res);

      this.setState({
        downloads: [
          ...downloads,
          res,
        ],
      });
    });
  }

  // handle the clear downloads event
  handleClearDownloads = () => {
    this.setState({
      downloads: [],
    }, () => {
      reportingDB.allDocs({
        include_docs: true,
      }).then((res) => {
        res.rows.forEach((row) => {
          reportingDB.remove(row.doc);
        });
      }).catch((err) => {
        throw err;
      });
    });
  }

  // handle the sign out method
  handleSignOut = () => {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('expires_in');
    window.localStorage.removeItem('scope');
    window.localStorage.removeItem('token_type');
    window.localStorage.removeItem('expires_at');
    window.location.href = `${API.consent}/logout`;
  }

  // handle admin btn click
  handleShowAdmin = (showAdmin) => {
    this.setState({
      showAdmin,
    });
  }

  // custom dynamic method for a dynamic width of the SuperTable
  getTableWidth = () => {
    const width = $(window).width() - 65;
    return width;
  }

  // custom dynamic method for a dynamic height of the SuperTable
  getTableHeight = () => {
    const height = $(window).height() - 280;
    return height;
  }

  // dynamic method for data layers height
  getDataLayersHeight = () => {
    const height = $(window).height();
    return height;
  }

  // render the downloads URL
  renderDownloadsURL = (file) => {
    return `${API.storage}/node/${file.drawer}/dl?id=${file.id}`;
  }

  // render the results
  renderResults = () => {
    const { dataLength } = this.state;

    if (dataLength === undefined) return '0 Results';
    return `${dataLength} Results`;
  }

  // render the data view based on layout
  renderDataView = () => {
    const { layoutSelected, activeData, headers } = this.state;

    if (layoutSelected === 'super-table') {
      return (
        <SuperTable data={activeData}
                    headers={headers}
                    getWidth={this.getTableWidth}
                    getHeight={this.getTableHeight}
                    showErrorsAndWarnings={false}
                    showActions={false} />
      );
    }

    return (
      <SuperGrid data={activeData}
                 headers={headers}
                 showErrorsAndWarnings={false}
                 showActions={false} />
    );
  }

  // render for history / pane
  renderPanes = () => {
    const {
      headers, dataLayersActive, searching, layoutSelected, activePageNo,
      activeLimit, dataLength, showHistory, history, historyMainSubtitle,
      pageLimits, pageDefaultLimitIndex,
    } = this.state;

    const pageCount = Math.ceil(dataLength / activeLimit);

    // show history
    if (showHistory) {
      return (
        <PaneHistory history={history}
                     onReset={this.handleHistoryReset}
                     mainSubtitle={historyMainSubtitle}
                     onCollapse={this.handleHistoryCollapse} />
      );
    }

    // main return
    return (
      <Pane title={(searching === '') ? 'All Results' : searching}
            subtitle={this.renderResults()}
            collapsed={false}
            onCollapse={this.handleActivePaneCollapse}>
        <div className="data-header">
          <div className="options-export">
            <DataEndpoint endpoint={window.location.href} />
            <OptionExport onExport={this.handleOptionExport} />
          </div>
          <OptionView selected={layoutSelected} onChange={this.handleOptionViewChange} />
          <IconButton image={imgDataLayers} imageAlt="Data Layers" onClick={this.handleDataLayersActive}>Data Layers</IconButton>
          <DataLayers headers={headers}
                      active={dataLayersActive}
                      onSave={this.handleDataLayersSave}
                      getHeight={this.getDataLayersHeight} />
        </div>
        {this.renderDataView()}
        <div className="data-footer">
          <div className="pull-left">
            <OptionPageLimit onChange={this.handlePageLimitChange}
                             limits={pageLimits}
                             defaultLimitIndex={pageDefaultLimitIndex} />
          </div>
          <div className="pull-right">
            <Pagination
              bsSize='medium'
              ellipsis={true}
              maxButtons={10}
              first={true}
              last={true}
              items={pageCount}
              activePage={activePageNo}
              onSelect={this.handlePageSelect}
            />
          </div>
          <div className="clearfix"></div>
        </div>
      </Pane>
    );
  }

  render() {
    const { searching, loading, downloads, user, showAdmin } = this.state;

    return (
      <div className="App">
        <Navbar fluid={true} className="header">
          <Navbar.Header>
            <Navbar.Brand>
              <img src={logo} alt="Data Hub" />
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Form pullLeft className="search">
            <SearchBar query={(searching === '') ? '' : searching} onSearch={this.handleSearch} />
          </Navbar.Form>
          <Navbar.Form pullRight className="dropdowns">
            <div className="dropdowns">
              <DropdownDownloads downloads={downloads}
                                 renderURL={this.renderDownloadsURL}
                                 onClear={this.handleClearDownloads} />
              {/* TODO: Make this conditional occur in the component */}
              {
                user.firstName &&
                <DropdownUser user={user} onSignOut={this.handleSignOut} />
              }
            </div>
          </Navbar.Form>
        </Navbar>
        <Loader active={loading} />
        {this.renderPanes()}
        <button id="adminBtn" onClick={this.handleShowAdmin.bind(null, true)} />
        <AdminModal showAdmin={showAdmin} onHide={this.handleShowAdmin} />
      </div>
    );
  }
}

export default App;
