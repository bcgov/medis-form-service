const { Observable } = require('rxjs');
const indexService = require('./services/IndexService');

const worker = new Observable((observer) => {
  indexService._init(observer);
});

worker.subscribe(({ data, schema }) => {
  const validator = new Observable((observer) => {
    indexService.validate(data, schema, observer);
  });

  const sub_val = validator.subscribe(async () => {
    sub_val.unsubscribe();
  });
});

const response = new Observable((observer) => {
  indexService.populate(observer);
});

response.subscribe((data) => {
  console.log(data);
});
