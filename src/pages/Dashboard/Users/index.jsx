import { useEffect, useRef, useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { Button, Modal, Col, Row, Space, Table, Form, Input, Upload, Tag, message, Popconfirm } from "antd";
import apiRequest from "../../../lib/api.js";
import prepareImageUpload from "../../../lib/prepareImageUpload.js";

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

const normalizeReport = (report, index) => ({ ...report, key: report._id, sr: index + 1 });

const exportHeaders = [
  "Sr.#",
  "AMO",
  "UC",
  "Supervisor Name & #",
  "TCP",
  "Vehicle / Rickshaw No",
  "Trip 01",
  "Trip 02",
  "Trip 03",
  "Total Trips",
  "Trip Achieved",
  "Remarks",
];

const makeColumnFilters = (records, getValue) => {
  const values = [...new Set(records.map((record) => String(getValue(record) ?? "")))].sort((left, right) =>
    left.localeCompare(right),
  );

  return {
    filters: values.map((value) => ({ text: value || "(blank)", value })),
    filterSearch: values.length > 6,
    onFilter: (value, record) => String(getValue(record) ?? "") === value,
  };
};

const Users = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [todayDate, setTodayDate] = useState(getPakistanDate);
  const [uploadingImages, setUploadingImages] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const previewUrls = useRef(new Set());
  const [reportsByDate, setReportsByDate] = useState({});
  const [loadedDates, setLoadedDates] = useState({});
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const reportDate = todayDate;
  const isLoading = !loadedDates[reportDate];
  const dataSource = reportsByDate[reportDate] || [];
  const sortedReports = [...dataSource].sort((left, right) => {
    const amoOrder = String(left.amo || "").localeCompare(String(right.amo || ""), undefined, {
      sensitivity: "base",
    });
    if (amoOrder) return amoOrder;
    const ucOrder = String(left.uc || "").localeCompare(String(right.uc || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return (
      ucOrder ||
      String(left.vehicleNo || "").localeCompare(String(right.vehicleNo || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  });
  const visibleDataSource = isLoading ? [] : sortedReports.map((report, index) => ({ ...report, sr: index + 1 }));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTodayDate((currentDate) => {
        const nextDate = getPakistanDate();
        return nextDate === currentDate ? currentDate : nextDate;
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    if (loadedDates[reportDate]) return undefined;

    apiRequest(`/reports?date=${reportDate}`)
      .then((reports) => {
        if (!isMounted) return;
        setReportsByDate((current) => ({
          ...current,
          [reportDate]: reports.map(normalizeReport),
        }));
        setLoadedDates((current) => ({ ...current, [reportDate]: true }));
      })
      .catch((error) => {
        if (isMounted) message.error(error.message);
      });
    return () => {
      isMounted = false;
    };
  }, [loadedDates, reportDate]);

  const handleTableCellImageUpload = async (file, recordKey, tripField) => {
    const uploadKey = `${recordKey}:${tripField}`;
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.add(previewUrl);
    setImagePreviews((current) => ({ ...current, [uploadKey]: previewUrl }));
    setUploadingImages((current) => ({ ...current, [uploadKey]: null }));

    try {
      const imageEndpoint = `/reports/${recordKey}/images/${tripField}`;
      const optimizedFile = await prepareImageUpload(file);
      setUploadingImages((current) => ({ ...current, [uploadKey]: true }));
      const formData = new FormData();
      formData.append("image", optimizedFile);
      const report = await apiRequest(imageEndpoint, {
        method: "POST",
        body: formData,
      });
      setReportsByDate((current) => ({
        ...current,
        [reportDate]: (current[reportDate] || []).map((item) =>
          item.key === recordKey ? { ...report, key: recordKey, sr: item.sr } : item,
        ),
      }));
      message.success("Image uploaded successfully!");
    } catch (error) {
      message.error(`Image upload failed: ${error.message}`);
    } finally {
      URL.revokeObjectURL(previewUrl);
      previewUrls.current.delete(previewUrl);
      setImagePreviews((current) => {
        const next = { ...current };
        delete next[uploadKey];
        return next;
      });
      setUploadingImages((current) => {
        const next = { ...current };
        delete next[uploadKey];
        return next;
      });
    }
    return false;
  };

  const handleRemoveImage = async (recordKey, tripField) => {
    const currentReport = dataSource.find((item) => item.key === recordKey);
    if (!currentReport) return;
    const previousImage = currentReport[tripField];
    setReportsByDate((current) => ({
      ...current,
      [reportDate]: (current[reportDate] || []).map((item) =>
        item.key === recordKey ? { ...item, [tripField]: null } : item,
      ),
    }));

    try {
      const report = await apiRequest(`/reports/${recordKey}/images/${tripField}`, { method: "DELETE" });
      setReportsByDate((current) => ({
        ...current,
        [reportDate]: (current[reportDate] || []).map((item) =>
          item.key === recordKey ? { ...report, key: recordKey, sr: item.sr } : item,
        ),
      }));
      message.success("Image removed.");
    } catch (error) {
      setReportsByDate((current) => ({
        ...current,
        [reportDate]: (current[reportDate] || []).map((item) =>
          item.key === recordKey ? { ...item, [tripField]: previousImage } : item,
        ),
      }));
      message.error(error.message);
    }
  };

  // Render Image Cell inside Table
  const renderTableImageCell = (imageUrl, record, tripField, tripLabel) => {
    const uploadKey = `${record.key}:${tripField}`;
    const uploadProgress = uploadingImages[uploadKey];
    const isUploading = uploadProgress !== undefined;
    const shownImageUrl = imagePreviews[uploadKey] || imageUrl;
    if (shownImageUrl) {
      return (
        <div
          style={{
            position: "relative",
            width: "75px",
            height: "55px",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #d9d9d9",
            margin: "0 auto",
          }}
        >
          <img src={shownImageUrl} alt={tripLabel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              display: "flex",
              gap: "2px",
            }}
          >
            {/* Edit Button Overlay */}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => handleTableCellImageUpload(file, record.key, tripField)}
            >
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                loading={isUploading}
                style={{
                  width: "20px",
                  height: "20px",
                  fontSize: "10px",
                  padding: 0,
                }}
              />
            </Upload>
            {/* Delete Image Overlay */}
            <Popconfirm
              title="Delete image?"
              description="Are you sure to remove this image?"
              onConfirm={() => handleRemoveImage(record.key, tripField)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
                style={{
                  width: "20px",
                  height: "20px",
                  fontSize: "10px",
                  padding: 0,
                }}
              />
            </Popconfirm>
          </div>
        </div>
      );
    }

    return (
      <Upload showUploadList={false} beforeUpload={(file) => handleTableCellImageUpload(file, record.key, tripField)}>
        <Button type="dashed" size="large" icon={<UploadOutlined />} loading={isUploading} style={{ fontSize: "11px" }}>
          {isUploading ? (uploadProgress === null ? "Preparing" : "Uploading") : "Upload"}
        </Button>
      </Upload>
    );
  };

  // Open Modal for Adding New Record
  const showAddModal = () => {
    setEditingKey(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Open Modal for Editing Existing Record
  const handleEditClick = (record) => {
    setEditingKey(record.key);
    // Convert date string back to dayjs object for Antd DatePicker
    form.setFieldsValue({
      ...record,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // Submit Handler for Modal Form (Handles both Add & Edit)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: reportDate,
      };
      const isEditing = Boolean(editingKey);
      const previousReport = isEditing ? dataSource.find((item) => item.key === editingKey) : null;
      const temporaryKey = isEditing ? editingKey : `pending-${Date.now()}`;
      const optimisticReport = {
        ...(previousReport || { trip1Image: null, trip2Image: null, trip3Image: null }),
        ...payload,
        _id: temporaryKey,
        key: temporaryKey,
        sr: previousReport?.sr ?? dataSource.length + 1,
      };

      setReportsByDate((current) => ({
        ...current,
        [reportDate]: isEditing
          ? (current[reportDate] || []).map((item) => (item.key === editingKey ? optimisticReport : item))
          : [...(current[reportDate] || []), optimisticReport],
      }));

      try {
        const report = isEditing
          ? await apiRequest(`/reports/${editingKey}`, { method: "PATCH", body: payload })
          : await apiRequest("/reports", { method: "POST", body: payload });
        setReportsByDate((current) => ({
          ...current,
          [reportDate]: (current[reportDate] || []).map((item) =>
            item.key === temporaryKey ? { ...report, key: report._id, sr: item.sr } : item,
          ),
        }));
        message.success(isEditing ? "Record updated successfully!" : "New report entry added!");
      } catch (error) {
        setReportsByDate((current) => ({
          ...current,
          [reportDate]: isEditing
            ? (current[reportDate] || []).map((item) => (item.key === editingKey ? previousReport : item))
            : (current[reportDate] || []).filter((item) => item.key !== temporaryKey),
        }));
        throw error;
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.message);
    }
  };

  const handleDeleteRow = async (key) => {
    const previousData = dataSource;
    setReportsByDate((current) => ({
      ...current,
      [reportDate]: (current[reportDate] || []).filter((item) => item.key !== key).map(normalizeReport),
    }));
    try {
      await apiRequest(`/reports/${key}`, { method: "DELETE" });
      message.success("Record deleted successfully!");
    } catch (error) {
      setReportsByDate((current) => ({ ...current, [reportDate]: previousData }));
      message.error(error.message);
    }
  };

  // Table Columns Setup
  const textColumnFilters = (field) => makeColumnFilters(visibleDataSource, (record) => record[field]);
  const imageColumnFilters = (field) =>
    makeColumnFilters(visibleDataSource, (record) => (record[field] ? "Uploaded" : "Missing"));
  const tripCount = (record) => [record.trip1Image, record.trip2Image, record.trip3Image].filter(Boolean).length;
  const searchedDataSource = visibleDataSource.filter((record) =>
    String(record.vehicleNo || "")
      .toLowerCase()
      .includes(vehicleSearch.trim().toLowerCase()),
  );

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.calcProperties = { fullCalcOnLoad: true, forceFullCalc: true };
      const worksheet = workbook.addWorksheet("Vehicle Reports");
      const border = { style: "thin", color: { argb: "FF000000" } };
      const amoColors = [
        { name: "haq nawaz", color: "FFCCC0DA" },
        { name: "fiaz", color: "FF92CDDC" },
        { name: "ahsan", color: "FFFABF8F" },
        { name: "gazanfar", color: "FF92D050" },
        { name: "adeel", color: "FFDA9694" },
      ];
      const amoFillByName = new Map();
      visibleDataSource.forEach((record) => {
        const amoKey = String(record.amo || "Unassigned AMO")
          .trim()
          .toLocaleLowerCase();
        if (!amoFillByName.has(amoKey)) {
          const match = amoColors.find(({ name }) => amoKey.includes(name));
          amoFillByName.set(amoKey, match?.color || "FFF2F3F5");
        }
      });
      const rows = searchedDataSource.map((record) => {
        const trips = [record.trip1Image, record.trip2Image, record.trip3Image];
        const tripCount = trips.filter(Boolean).length;
        return [
          record.sr,
          record.amo || "",
          record.uc || "",
          record.supervisor || "",
          record.tcp || "",
          record.vehicleNo || "",
          "",
          "",
          "",
          tripCount,
          tripCount > 0 ? "YES" : "NO",
          record.remarks || "",
        ];
      });
      const columnWidths = [8, 28, 10, 30, 22, 22, 18, 18, 18, 14, 18, 30];

      worksheet.columns = exportHeaders.map((header, index) => ({
        header,
        key: `column${index + 1}`,
        width: columnWidths[index],
      }));
      worksheet.mergeCells("A1:F1");
      worksheet.mergeCells("G1:L1");
      worksheet.getCell("A1").value = "Daily trip report";
      worksheet.getCell("A1").font = { name: "Times New Roman", bold: true, size: 20, align: "center" };
      worksheet.getCell("A1").alignment = { horizontal: "left", vertical: "middle" };
      worksheet.getCell("G1").value = `Date: ${reportDate}`;
      worksheet.getCell("G1").font = { name: "Times New Roman", bold: true, size: 14 };
      worksheet.getCell("G1").alignment = { horizontal: "right", vertical: "middle" };
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
      });
      worksheet.getRow(1).height = 60;

      const headerRow = worksheet.getRow(2);
      headerRow.values = exportHeaders;
      headerRow.height = 60;
      headerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: "Times New Roman", bold: true, size: 14 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC4D79B" } };
        cell.border = { top: border, right: border, bottom: border, left: border };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });

      let failedImageCount = 0;
      for (let index = 0; index < rows.length; index += 1) {
        const rowNumber = index + 3;
        const row = worksheet.getRow(rowNumber);
        row.values = rows[index];
        row.height = 60;
        const amoKey = String(searchedDataSource[index].amo || "Unassigned AMO")
          .trim()
          .toLocaleLowerCase();
        const amoFill = amoFillByName.get(amoKey);
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          cell.font = { name: "Times New Roman", bold: true, size: 14 };
          if (columnNumber === 2) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: amoFill } };
          }
          cell.border = { top: border, right: border, bottom: border, left: border };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });

        const tripImages = [
          { image: searchedDataSource[index].trip1Image, column: "G" },
          { image: searchedDataSource[index].trip2Image, column: "H" },
          { image: searchedDataSource[index].trip3Image, column: "I" },
        ];
        const embeddedImages = await Promise.all(
          tripImages.map(async ({ image, column }) => {
            if (!image?.url) return null;
            try {
              const response = await fetch(image.url);
              if (!response.ok) throw new Error("Unable to load image");
              const bitmap = await createImageBitmap(await response.blob());
              const scale = Math.min(1, 120 / bitmap.width, 75 / bitmap.height);
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(bitmap.width * scale));
              canvas.height = Math.max(1, Math.round(bitmap.height * scale));
              canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
              bitmap.close();
              return {
                id: workbook.addImage({ base64: canvas.toDataURL("image/png"), extension: "png" }),
                range: `${column}${rowNumber}:${column}${rowNumber}`,
              };
            } catch {
              failedImageCount += 1;
              return null;
            }
          }),
        );
        embeddedImages.forEach((image) => {
          if (image) worksheet.addImage(image.id, image.range);
        });
      }

      const lastDataRow = Math.max(2, rows.length + 2);
      const totalRow = worksheet.getRow(lastDataRow + 1);
      totalRow.height = 60;
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: "Times New Roman", bold: true, size: 14 };
        cell.border = { top: border, right: border, bottom: border, left: border };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });
      worksheet.mergeCells(`A${totalRow.number}:H${totalRow.number}`);
      worksheet.mergeCells(`I${totalRow.number}:L${totalRow.number}`);
      const grandTotalLabel = worksheet.getCell(`A${totalRow.number}`);
      grandTotalLabel.value = "Grand Total";
      grandTotalLabel.font = { name: "Times New Roman", bold: true, size: 26 };
      grandTotalLabel.alignment = { horizontal: "center", vertical: "middle" };
      grandTotalLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC0CB" } };
      const grandTotalValue = worksheet.getCell(`I${totalRow.number}`);
      grandTotalValue.font = { name: "Times New Roman", bold: true, size: 26 };
      grandTotalValue.alignment = { horizontal: "center", vertical: "middle" };
      grandTotalValue.value = rows.length
        ? { formula: `SUM(J3:J${lastDataRow})`, result: rows.reduce((sum, row) => sum + Number(row[9] || 0), 0) }
        : 0;
      grandTotalValue.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF87CEEB" } };

      worksheet.views = [{ state: "frozen", ySplit: 2, topLeftCell: "A3", showGridLines: true }];
      worksheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printArea: `A1:L${totalRow.number}`,
        printTitlesRow: "2:2",
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `Daily-Trip-Report-${reportDate}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      message.success("Excel exported successfully.");
      if (failedImageCount) message.warning(`${failedImageCount} image(s) could not be included.`);
    } catch {
      message.error("Unable to export Excel file.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    { title: "Sr.#", dataIndex: "sr", key: "sr", width: 50, align: "center", ...textColumnFilters("sr") },
    { title: "AMO", dataIndex: "amo", key: "amo", ...textColumnFilters("amo") },
    { title: "UC", dataIndex: "uc", key: "uc", width: 60, align: "center", ...textColumnFilters("uc") },
    {
      title: "Supervisor Name & #",
      dataIndex: "supervisor",
      key: "supervisor",
      ...textColumnFilters("supervisor"),
    },
    { title: "TCP", dataIndex: "tcp", key: "tcp", ...textColumnFilters("tcp") },
    {
      title: "Vehicle / Rickshaw No",
      dataIndex: "vehicleNo",
      key: "vehicleNo",
      ...textColumnFilters("vehicleNo"),
    },

    {
      title: "Trip 01",
      dataIndex: "trip1Image",
      key: "trip1Image",
      align: "center",
      ...imageColumnFilters("trip1Image"),
      render: (img, record) => renderTableImageCell(img?.url, record, "trip1Image", "Trip 01"),
    },
    {
      title: "Trip 02",
      dataIndex: "trip2Image",
      key: "trip2Image",
      align: "center",
      ...imageColumnFilters("trip2Image"),
      render: (img, record) => renderTableImageCell(img?.url, record, "trip2Image", "Trip 02"),
    },
    {
      title: "Trip 03",
      dataIndex: "trip3Image",
      key: "trip3Image",
      align: "center",
      ...imageColumnFilters("trip3Image"),
      render: (img, record) => renderTableImageCell(img?.url, record, "trip3Image", "Trip 03"),
    },
    {
      title: "Total Trips",
      key: "totalTrips",
      align: "center",
      width: 100,
      ...makeColumnFilters(visibleDataSource, (record) => tripCount(record)),
      render: (_, record) => {
        const count = tripCount(record);
        let tagColor = "error";
        if (count === 3) tagColor = "success";
        else if (count === 2) tagColor = "processing";
        else if (count === 1) tagColor = "warning";

        return (
          <Tag color={tagColor} style={{ fontWeight: "bold", padding: "2px 8px" }}>
            {count} / 3
          </Tag>
        );
      },
    },
    {
      title: "Trip Achieved",
      key: "tripAchieved",
      align: "center",
      width: 110,
      ...makeColumnFilters(visibleDataSource, (record) => (tripCount(record) > 0 ? "YES" : "NO")),
      render: (_, record) => {
        const isAchieved = Boolean(record.trip1Image) || Boolean(record.trip2Image) || Boolean(record.trip3Image);
        return isAchieved ? (
          <Tag color="success" style={{ fontWeight: "bold", padding: "2px 8px" }}>
            YES
          </Tag>
        ) : (
          <Tag color="error" style={{ fontWeight: "bold", padding: "2px 8px" }}>
            NO
          </Tag>
        );
      },
    },
    { title: "Remarks", dataIndex: "remarks", key: "remarks", ...textColumnFilters("remarks") },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {/* Edit Button */}
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleEditClick(record)}
          />

          {/* Delete Row with Popconfirm */}
          <Popconfirm
            title="Delete Record"
            description="Are you sure you want to delete this row?"
            onConfirm={() => handleDeleteRow(record.key)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const centeredColumns = columns.map((column) => ({ ...column, align: "center" }));

  return (
    <main className="container my-4">
      {/* Top Header */}
      <Row className="mb-3" align="middle" justify="space-between">
        <Col>
          <h3 className="fw-bold m-0 text-center text-success">{`Suthra Punjab Agency (SPA) OKARA`}</h3>
        </Col>
        <Col>
          <Space direction="vertical" align="end">
            <div className="fw-semibold">{`Today · ${todayDate}`}</div>
            <Space wrap>
              <Button icon={<FileExcelOutlined />} loading={isExporting} onClick={handleExportExcel}>
                Export Excel
              </Button>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={showAddModal}>
                Add Record
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>
      {/* Main Table */}

      <Row className="mb-2">
        <Col xs={24} md={8}>
          <Input.Search
            allowClear
            value={vehicleSearch}
            onChange={(event) => setVehicleSearch(event.target.value)}
            placeholder="Search vehicle number"
          />
        </Col>
      </Row>

      <Table
        className="table-responsive"
        columns={centeredColumns}
        dataSource={searchedDataSource}
        loading={isLoading}
        bordered
        pagination={{ pageSize: 10 }}
      />
      {/* Shared Modal for Add & Edit */}
      <Modal
        title={editingKey ? "Edit Vehicle Record" : "Add New Vehicle Record"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={editingKey ? "Update Record" : "Save Record"}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amo" label="AMO" rules={[{ required: true, message: "Please enter AMO" }]}>
                <Input placeholder="e.g. Haq Nawaz 0345-7538817" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supervisor"
                label="Supervisor Name & Contact"
                rules={[{ required: true, message: "Please enter Supervisor" }]}
              >
                <Input placeholder="e.g. Jahanzaib" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="uc" label="UC" rules={[{ required: true, message: "Please enter UC" }]}>
                <Input placeholder="e.g. 8" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vehicleNo"
                label="Vehicle / Rickshaw No"
                rules={[{ required: true, message: "Please enter Vehicle No" }]}
              >
                <Input placeholder="e.g. OKR-LR-050" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tcp" label="TCP">
                <Input placeholder="e.g. TCP-SATGARAH" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Enter remarks..." />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
};

export default Users;
