import { HashRouter, Routes, Route } from 'react-router-dom'
import Setup from './pages/host/Setup.jsx'
import UploadBill from './pages/host/UploadBill.jsx'
import ReviewBill from './pages/host/ReviewBill.jsx'
import BillType from './pages/host/BillType.jsx'
import TransferDetails from './pages/host/TransferDetails.jsx'
import AddMembers from './pages/host/AddMembers.jsx'
import Publish from './pages/host/Publish.jsx'
import Dashboard from './pages/host/Dashboard.jsx'
import MemberRouter from './pages/member/MemberRouter.jsx'
import NotFound from './pages/shared/NotFound.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
        <Route path="/host/upload" element={<UploadBill />} />
        <Route path="/host/review" element={<ReviewBill />} />
        <Route path="/host/type" element={<BillType />} />
        <Route path="/host/transfer" element={<TransferDetails />} />
        <Route path="/host/members" element={<AddMembers />} />
        <Route path="/host/publish" element={<Publish />} />
        <Route path="/host/dashboard/:billId" element={<Dashboard />} />
        <Route path="/member/:billId/:memberToken" element={<MemberRouter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
