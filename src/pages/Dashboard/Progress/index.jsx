import { useEffect, useState } from "react";
import { ReloadOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Progress as AntProgress, Row, Spin, Statistic, Typography, message } from "antd";
import apiRequest from "../../../lib/api.js";

const getPakistanDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getTripCount = (report) => [report.trip1Image, report.trip2Image, report.trip3Image].filter(Boolean).length;

const Progress = () => {
  const [today, setToday] = useState(getPakistanDate);
  const [reports, setReports] = useState([]);
  const [loadedDate, setLoadedDate] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday((current) => {
        const date = getPakistanDate();
        return date === current ? current : date;
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    apiRequest(`/reports?date=${today}`, { skipMemoryCache: refreshVersion > 0 })
      .then((data) => {
        if (!isMounted) return;
        setReports(data);
        setLoadedDate(today);
        setHasError(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        setHasError(true);
        message.error(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, [today, refreshVersion]);

  const groups = [
    ...reports
      .reduce((byAmo, report) => {
        const amo = report.amo?.trim() || "Unassigned AMO";
        const group = byAmo.get(amo) || { amo, vehicles: 0, archived: 0, trips: 0 };
        const tripCount = getTripCount(report);
        group.vehicles += 1;
        group.trips += tripCount;
        if (tripCount > 0) group.archived += 1;
        byAmo.set(amo, group);
        return byAmo;
      }, new Map())
      .values(),
  ].sort((left, right) => left.amo.localeCompare(right.amo, undefined, { sensitivity: "base" }));

  const isLoading = loadedDate !== today && !hasError;

  return (
    <section className="progress-page">
      <div className="progress-heading">
        <div>
          <Typography.Text className="overview-eyebrow">AMO PERFORMANCE</Typography.Text>
          <Typography.Title level={3} className="overview-title">
            Archive progress
          </Typography.Title>
          <Typography.Text className="overview-date">
            {today} · {groups.length} AMOs
          </Typography.Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          aria-label="Refresh AMO progress"
          title="Refresh progress"
          onClick={() => setRefreshVersion((version) => version + 1)}
        />
      </div>

      {hasError ? (
        <Empty description="Could not load today's AMO progress" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => setRefreshVersion((version) => version + 1)}>
            Try again
          </Button>
        </Empty>
      ) : isLoading ? (
        <div className="progress-loading">
          <Spin size="large" />
        </div>
      ) : groups.length === 0 ? (
        <Empty description="No vehicle reports for today" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Row gutter={[16, 16]}>
          {groups.map((group) => {
            const percentage = group.vehicles ? Math.round((group.archived / group.vehicles) * 100) : 0;
            const status =
              percentage === 100
                ? "complete"
                : percentage >= 50
                  ? "on-track"
                  : percentage > 0
                    ? "in-progress"
                    : "pending";
            const ringColors = {
              complete: "#4f7d56",
              "on-track": "#477895",
              "in-progress": "#b17a32",
              pending: "#a45b55",
            };
            return (
              <Col key={group.amo} xs={24} md={12} xxl={8}>
                <Card className={`progress-amo-card progress-amo-card-${status}`} bordered>
                  <div className="progress-amo-card-heading">
                    <div className="progress-amo-identity">
                      <span className="progress-amo-icon">
                        <TeamOutlined />
                      </span>
                      <div>
                        <Typography.Text className="progress-amo-label">AMO</Typography.Text>
                        <Typography.Title level={5} className="progress-amo-name">
                          {group.amo}
                        </Typography.Title>
                      </div>
                    </div>
                    <AntProgress
                      type="circle"
                      percent={percentage}
                      size={68}
                      strokeColor={ringColors[status]}
                      trailColor="#e8ede6"
                      format={(value) => <span className="progress-ring-label">{value}%</span>}
                    />
                  </div>
                  <div className="progress-amo-stats">
                    <Statistic title="Vehicles" value={group.vehicles} />
                    <Statistic title="Archived" value={group.archived} />
                    <Statistic title="Trips uploaded" value={group.trips} />
                  </div>
                  <div className="progress-amo-ratio">
                    <span>Archive ratio</span>
                    <strong>
                      {group.archived} / {group.vehicles} vehicles
                    </strong>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </section>
  );
};

export default Progress;
