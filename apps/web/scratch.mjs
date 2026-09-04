import axios from 'axios';
console.log(axios.getUri({ baseURL: 'http://localhost:3001/api/v1', url: '/kkn-attendance/manual' }));
console.log(axios.getUri({ baseURL: 'http://localhost:3001/api/v1', url: 'kkn-attendance/manual' }));
console.log(axios.getUri({ baseURL: 'http://localhost:3001/api/v1', url: '/manual' }));
