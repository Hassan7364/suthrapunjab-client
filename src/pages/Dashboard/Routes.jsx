import { Route, Routes } from "react-router-dom";

import Home from "./Home";
import Progress from "./Progress";
import Users from "./Users";

import NoPage from "../../components/Misc/NoPage";

const Index = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<NoPage />} />
      </Routes>
    </>
  );
};

export default Index;
