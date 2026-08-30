import Reactotron from 'reactotron-react-native';

Reactotron.configure({ name: 'TTT Mobile' })
  .useReactNative({
    networking: {
      fetch: globalThis.fetch,
    },
  })
  .connect();
