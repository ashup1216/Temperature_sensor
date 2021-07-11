import React, { Component } from "react";
import { AgGridReact } from "ag-grid-react";
import "@ag-grid-community/core/dist/styles/ag-grid.css";
import "@ag-grid-community/core/dist/styles/ag-theme-alpine.css";
import readings from "../assets/readings.json";
import sensors from "../assets/sensors.json";
import TimezoneSelect, { i18nTimezones } from "react-timezone-select";
import moment from "moment";

import "moment-timezone";
import "../App.css";

function actionCellRenderer(params) {
  let eGui = document.createElement("div");
  if (params.data.type === "Temperature Sensor") {
    eGui.innerHTML = `<label>Celsius</label><label class="switch">
        <input type="checkbox">
        <span class="slider round"></span>
      </label><label>Fahrenheit</label>`;
  } else {
    eGui.innerHTML = ``;
  }

  return eGui;
}

export default class SensorData extends Component {
  constructor(props) {
    super(props);

    this.state = {
      columnDefs: [
        { headerName: "Room Name", field: "name" },
        { headerName: "Sensor Type", field: "type" },
        {
          headerName: "Readings",
          field: "value",
          valueFormatter: (params) => params.value.toFixed(2),
          width: 110,
        },
        { headerName: "Units", field: "units", width: 100 },
        { headerName: "Time Stamp", field: "time", width: 180 },
        { headerName: "Created Time", field: "createdAt" },
        {
          headerName: "action",
          minWidth: 150,
          width: 230,
          cellRenderer: actionCellRenderer,
          editable: false,
          colId: "action",
        },
      ],
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true
      },
      rowData: null,
      selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      selectedTemp: "",
    };
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    const updateData = (data) => {
      this.setState({ rowData: data });
    };

    let merged = [];
    for (let i = 0; i < readings.length; i++) {
      merged.push({
        ...readings[i],
        ...sensors.find((itmInner) => itmInner.id === readings[i].sensorId),
      });
    }
    merged.forEach((row) => {
      row.createdAt = this.convertLocalToTimezone(
        moment(row.createdAt),
        null,
        this.state.selectedTimezone
      );
      row.time = this.convertLocalToTimezone(
        moment(row.time),
        null,
        this.state.selectedTimezone
      );
    });
    updateData(merged);
  };

  onCellClicked = (params) => {
    this.setState({ selectedTemp: params.data.value }, function () {
      if (params.column.colId === "action") {
        let checkedData = params.event.target.checked;
        if (checkedData === false) {
          params.data.value = ((this.state.selectedTemp - 32) * 5) / 9;
          params.data.units = "Celsius";
          params.api.refreshCells({ columns: ["value", "units"] });
        } else if (checkedData === true) {
          params.data.value = (this.state.selectedTemp * 9) / 5 + 32;
          params.data.units = "Fahrenheit";
          params.api.refreshCells({ columns: ["value", "units"] });
        }
      }
    });
  };
  setSelectedTimezone = (zoneData) => {
    this.setState({ selectedTimezone: zoneData.value }, function () {
      this.gridApi.forEachNode(this.setTimeZone);
    });
  };

  convertLocalToTimezone = (localDt, localDtFormat, timezone) => {
    return moment(localDt, localDtFormat).tz(timezone).format("lll");
  };

  setTimeZone = (node, index) => {
    node.data.createdAt = this.convertLocalToTimezone(
      moment(node.data.createdAt),
      null,
      this.state.selectedTimezone
    );
    node.data.time = this.convertLocalToTimezone(
      moment(node.data.time),
      null,
      this.state.selectedTimezone
    );
    this.gridApi.refreshCells({ columns: ['createdAt', 'time'] });
  };

  render() {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <h2 style={{ textAlign: "center" }}>Sensor Readings</h2>
        <div style={{ width: "50%", marginBottom: "24px" }}>
          <TimezoneSelect
            value={this.state.selectedTimezone}
            onChange={this.setSelectedTimezone}
            timezones={{
              ...i18nTimezones,
            }}
          />
        </div>

        <div
          id="myGrid"
          style={{
            height: "500px",
            width: "100%",
          }}
          className="ag-theme-alpine"
        >
          <AgGridReact
            onCellClicked={this.onCellClicked}
            columnDefs={this.state.columnDefs}
            defaultColDef={this.state.defaultColDef}
            onGridReady={this.onGridReady}
            rowData={this.state.rowData}
          />
        </div>
      </div>
    );
  }
}
