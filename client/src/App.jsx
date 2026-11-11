import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Accueil from './pages/Accueil';
import Hackathons from './pages/Hackathons';
import HackathonDetail from './pages/HackathonDetail';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import MesEvenements from './pages/MesEvenements';
import Publier from './pages/Publier';
import MesPublications from './pages/MesPublications';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Pages publiques */}
        <Route path="/" element={<Accueil />} />
        <Route path="/hackathons" element={<Hackathons />} />
        <Route path="/hackathons/:id" element={<HackathonDetail />} />
        <Route path="/connexion" element={<Connexion />} />

        {/* Pages réservées aux utilisateurs connectés */}
        <Route path="/hackathons/:id/inscription" element={<ProtectedRoute><Inscription /></ProtectedRoute>} />
        <Route path="/mes-evenements" element={<ProtectedRoute><MesEvenements /></ProtectedRoute>} />
        <Route path="/publier" element={<ProtectedRoute><Publier /></ProtectedRoute>} />
        <Route path="/mes-publications" element={<ProtectedRoute><MesPublications /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
