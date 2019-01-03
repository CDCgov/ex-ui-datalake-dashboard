export const API = {
  reporting: `${window.config.REPORTING_URL}/api/1.0`,
  indexing: `${window.config.INDEXING_URL}/api/1.0`,
  storage: `${window.config.STORAGE_URL}/api/1.0`,
  object: `${window.config.OBJECT_URL}/api/1.0`,
  datahub: `${window.config.DATAHUB_URL}/api/1.0`,
  consent: `${window.config.CONSENT_URL}`,
};

const index = 'datahub-annualSurvey';
const database = 'datahub';
const collection = 'annualSurvey';
API.indexingSearchWet = `${API.indexing}/search/${index}?hydrate=true`;
API.indexingSearchDry = `${API.indexing}/search/${index}?hydrate=false`;
API.objectSearch = `${API.object}/${database}/${collection}/search`;
API.objectCount = `${API.object}/${database}/${collection}/search?size=1`;

// replace this value with your OAuth 2.0 provider
export const authURL = window.config.AUTH_URL;

export const secureMode = window.config.SECURE_MODE;
