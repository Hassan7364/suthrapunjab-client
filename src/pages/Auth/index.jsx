import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./Login";

import NoPage from "../../components/Misc/NoPage";

const Auth = () => {
  return (
    <>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NoPage />} />
      </Routes>
    </>
  );
};

export default Auth;
