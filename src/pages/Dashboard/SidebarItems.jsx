import { DashboardOutlined, PieChartOutlined, TeamOutlined } from "@ant-design/icons";

export const items = [
  {
    key: "/dashboard",
    label: "Overview",
    icon: <DashboardOutlined />,
  },
  {
    key: "/dashboard/progress",
    label: "Progress",
    icon: <PieChartOutlined />,
  },
  {
    key: "/dashboard/users",
    label: "Workers & Reports",
    icon: <TeamOutlined />,
  },
];
