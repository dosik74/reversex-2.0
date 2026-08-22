import App from './App';
import { GlobalProvider } from './context/GlobalContext';

const PinkGlassPage = () => (
  <GlobalProvider>
    <App />
  </GlobalProvider>
);

export default PinkGlassPage;
