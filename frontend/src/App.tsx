import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Browser from "./pages/Browser/Browser";
import MyClass from "./pages/MyClass/MyClass";
import Library from "./pages/Library/Library";
import Notifications from "./pages/Notifications/Notifications";
import Settings from "./pages/Settings/Settings";
import "./styles/global.css";
//import { LogIn } from "lucide-react";
import Login from "./pages/Login/Login";

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browser" element={<Browser />} />
          <Route path="/my-class" element={<MyClass />} />
          <Route path="/library" element={<Library />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} /> {/* Add Login route */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;