import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Companies from "../pages/Companies.jsx";
import CompanyDetail from "../pages/CompanyDetail.jsx";
import Assessments from "../pages/Assessments.jsx";
import AssessmentDetail from "../pages/AssessmentDetail.jsx";
import QuestionnaireFill from "../pages/QuestionnaireFill.jsx";
import Results from "../pages/Results.jsx";
import Reports from "../pages/Reports.jsx";
import Settings from "../pages/Settings.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/q/:token" element={<QuestionnaireFill />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/empresas" element={<Companies />} />
            <Route path="/empresas/:id" element={<CompanyDetail />} />
            <Route path="/evaluaciones" element={<Assessments />} />
            <Route path="/evaluaciones/:id" element={<AssessmentDetail />} />
            <Route path="/resultados" element={<Results />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/configuracion" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
