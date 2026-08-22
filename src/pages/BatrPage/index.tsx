import App from './App';
import { GlobalProvider } from './context/GlobalContext';

const BatrPage = () => (
  <GlobalProvider>
    <App />
  </GlobalProvider>
);

export default BatrPage;
