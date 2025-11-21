import Footer from '@/components/Footer/Footer'
import Navbar from '@/components/Navbar/Navbar'
import { Outlet } from 'react-router-dom'
import s from './RootLayout.module.scss'

export default function RootLayout() {
  return (
    <div className={s.layout}>
      <Navbar />

      {/* Contenu principal */}
      <main className={s.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}