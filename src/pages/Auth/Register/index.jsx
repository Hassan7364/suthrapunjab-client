import { Button, Col, Form, Input, Row, Typography } from "antd";

import { UserAddOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import apiRequest from "../../../lib/api.js";

const Register = () => {
  const { Title, Paragraph } = Typography;
  const { Password } = Input;
  const { Item } = Form;

  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const initialState = { fullName: "", email: "", password: "" };
  const [state, setState] = useState(initialState);

  const handleChange = (e) => setState((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    let { fullName, email, password } = state;

    fullName = fullName.trim();

    if (!fullName || !email || !password) return window.toastify("All fields are required!", "error");

    if (fullName.length < 3) return window.toastify("Enter a valid Full Name!", "error");
    if (!window.isValidEmail(email)) return window.toastify("Enter a valid email address!", "error");
    if (password.length < 8) return window.toastify("Password must be at least 8 characters!", "error");

    setIsProcessing(true);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: { fullName, email, password },
      });
      window.toastify("Sign Up successfull!", "success");
      navigate("/auth/login");
    } catch (error) {
      window.toastify(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <main className="auth bg-primary position-relative overflow-hidden p-3">
        <div
          className="circle circle1 position-absolute rounded-circle"
          style={{ top: "2vw", right: "60vw", backgroundColor: "#1dd8cd" }}
        >
          .
        </div>
        <div
          className="circle circle2 position-absolute rounded-circle"
          style={{ bottom: "2vw", left: "60vw", backgroundColor: "#9892d4" }}
        ></div>
        <div className="card rounded-0 border-0 z-1 p-2">
          <div className="container">
            <Row className="d-flex justify-content-center align-items-center">
              <Col span={24} className="text-center py-3">
                <UserAddOutlined style={{ fontSize: "40px", color: "#3ce2d7" }} />
              </Col>
              <Col span={24}>
                <Title className="text-center pb-3 fw-normal" level={2}>
                  Sign Up
                </Title>
              </Col>
              <Col span={24}>
                <Form layout="vertical">
                  <Item className="fw-medium" label="Full Name:" required>
                    <Input
                      className="rounded-2 px-3"
                      size="large"
                      type="text"
                      placeholder="Enter your name"
                      name="fullName"
                      onChange={handleChange}
                    />
                  </Item>
                  <Item className="fw-medium" label="Email:" required>
                    <Input
                      className="rounded-2 px-3"
                      size="large"
                      type="email"
                      placeholder="Enter your email"
                      name="email"
                      onChange={handleChange}
                    />
                  </Item>
                  <Item className="fw-medium" label="Password:" required>
                    <Password
                      className="rounded-2 px-3"
                      size="large"
                      type="text"
                      placeholder="Enter Password"
                      name="password"
                      onChange={handleChange}
                    />
                  </Item>
                  <Item>
                    <Button
                      className="rounded-1 box_shadow py-2"
                      type="primary"
                      size="large"
                      block
                      onClick={handleSubmit}
                      loading={isProcessing}
                      htmlType="submit"
                    >
                      Sign Up
                    </Button>
                  </Item>

                  <Paragraph className="fw-medium text-secondary text-center">
                    {`Already have an account? `}
                    <Link className="fw-bold text-decoration-none" to="/auth/login">
                      Login
                    </Link>
                  </Paragraph>
                </Form>
              </Col>
            </Row>
          </div>
        </div>
      </main>
    </>
  );
};

export default Register;
