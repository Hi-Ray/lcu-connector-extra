# lcu-connector-extra

## Credits
Most of the code in this repo is from [pupix](https://github.com/Pupix)

## Usage

### Connector
```JS
const LCUConnector = require('lcu-connector-extra').default;

const connector = new LCUConnector();

connector.on('connect', (data) => {
  console.log(data);
  //  {
  //    address: '127.0.0.1'
  //    port: 18633,
  //    username: 'riot',
  //    password: H9y4kOYVkmjWu_5mVIg1qQ,
  //    protocol: 'https'
  //  }
});

// Start listening for the LCU client
connector.start();
```

### Websocket
```JS
const { Websocket } = require('lcu-connector-extra');

const ws = new Websocket('wss://riot:Vb4qOZdKanoA-9UB9gAN_Q@localhost:60588/');
```

### LockfileParser

```JS
const { Lockfileparser } = require('lcu-connector-extra');

const lockfile = Lockfileparser.read(PATH_TO_LOCKFILE)
```
