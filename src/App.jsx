import { ConfigProvider } from "antd";

import Routes from "./pages/routes";

import "./App.scss";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle";
import "./config/global";

import ScreenLoader from "./components/Misc/ScreenLoader";
import { useAuthContext } from "./context/AuthContext.js";

function App() {
  const { isAppLoading } = useAuthContext();

  return (
    <>
      <ConfigProvider
        theme={{
          token: { colorPrimary: "#262f40" },
          components: {
            Button: { controlOutlineWidth: 0 },
          },
        }}
      >
        {!isAppLoading ? <Routes /> : <ScreenLoader />}
      </ConfigProvider>
    </>
  );
}

export default App;
