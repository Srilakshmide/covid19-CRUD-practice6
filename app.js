const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let database = null;

const initializesDbServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializesDbServer();

//API 1 Returns a list of all states in the state table

const convertToDbResponseOfState = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state`;
  const statesArray = await database.all(getAllStatesQuery);
  response.send(
    statesArray.map((eachItem) => convertToDbResponseOfState(eachItem))
  );
});

// API 2 Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateQueryResponse = await database.get(getStateDetailsQuery);
  response.send(convertToDbResponseOfState(stateQueryResponse));
});

//API 3 Create a district in the district table

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `INSERT INTO 
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const addDistrictQueryResponse = await database.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// API 4 Returns a district based on the district ID

const convertToDbResponseOfDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const districtQueryResponse = await database.get(getDistrictDetailsQuery);
  response.send(convertToDbResponseOfDistrict(districtQueryResponse));
});

//API 5 Deletes a district from the district table based on district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6 Updates the details of a specific district based on district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district SET
  district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}' WHERE district_id=${districtId};`;
  const updateDistrictQueryResponse = await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7 statistics of total cases, cured, active, deaths of a specific state

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `SELECT 
    SUM(cases) AS totalCases, SUM(cured) AS totalCured, 
    SUM(active) AS totalActive, SUM(deaths) AS totalDeaths 
    FROM district WHERE state_id = ${stateId};`;
  const statisticsQueryResponse = await database.get(getStatisticsQuery);
  response.send(statisticsQueryResponse);
});

//API 8 an object returns contains state name of district based on district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district 
    WHERE district_id=${districtId};`;
  const districtIdQueryResponse = await database.get(getDistrictIdQuery);
  const getStateNameQuery = `SELECT state_name AS stateName FROM state 
    WHERE state_id=${districtIdQueryResponse.state_id};`;
  const stateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(stateNameQueryResponse);
});

module.exports = app;
