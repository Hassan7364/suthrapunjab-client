import { Col, Row, Typography } from "antd";
import { Lottie } from "lottie-react";

import NotFound from "../../assets/Error404.json";

const NoPage = () => {
  return (
    <>
      <main className="d-flex justify-content-center align-items-center">
        <div className="container">
          <Row>
            <Col span={24}>
              <Lottie src={NotFound} loop autoplay style={{ height: "500px" }} />
            </Col>
          </Row>
        </div>
      </main>
    </>
  );
};

export default NoPage;
