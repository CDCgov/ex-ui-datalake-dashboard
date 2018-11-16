import React, { Component } from 'react';
import swal from 'sweetalert';
import $ from 'jquery';
import {
  IconButton, FormControl, ControlLabel, Form, FormGroup, Modal
} from 'fdns-ui-react';
import { API } from './defaults';

class AdminModal extends Component {
  // init
  constructor(props) {
    super(props);
    this.state = {
      showAdmin: props.showAdmin,
      year: new Date().getFullYear(),
      data: {},
    }
  }

  // handle year change
  handleYearChange = (e) => {;
    this.setState({
      year: e.target.value,
    });
  }

  // handle data
  handleData = (e) => {;
    this.setState({
      data: e.target.files[0],
    });
  }

  // handle the admin submit
  handleAdminSubmit = () => {
    const { data, year } = this.state;
    const url = `${API.datahub}/process/annual/${year}`;

    const formData = new FormData();
    formData.append('file', data);

    $.ajax({
      url: url,
      type: 'POST',
      data: formData,
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false,
      cache: false,
      timeout: 600000,
      success: (res) => {
        swal('Success', 'Data importing!', 'success');
      }
    });
  }

  // main render
  render() {
    const { year } = this.state;

    const modal = (
      <Modal show={this.props.showAdmin} onHide={this.props.onHide.bind(null, false)}>
        <Modal.Header closeButton>
          <Modal.Title>Datalake Dashboard UI Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FormGroup>
              <ControlLabel>Annual Survey Year</ControlLabel>
              <FormControl
                type="text"
                placeholder="Year"
                value={year}
                onChange={this.handleYearChange} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Annual Survey Data</ControlLabel>
              <FormControl
                type="file"
                onChange={this.handleData} />
            </FormGroup>
            <FormGroup>
              <IconButton bsStyle="primary" icon="sent" onClick={this.handleAdminSubmit}>Submit</IconButton>
            </FormGroup>
          </Form>
        </Modal.Body>
      </Modal>
    );

    return modal;
  }
}

export default AdminModal;
