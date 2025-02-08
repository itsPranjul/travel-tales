import { BrowserRouter as Router, Routes, Navigate, Route } from 'react-router-dom';
import React from 'react';
import Login from './pages/Auth/Login.jsx';
import SignUp from './pages/Auth/SignUp.jsx';
import Home from './pages/Home/Home.jsx';

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path='/' element={<Root />} />
          <Route path='/dashboard' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
        </Routes>
      </Router>
    </div>
  )
}

//define the root component to handle the initial redirect
const Root = () => {
  // check if token exists in localStorage
  const isAuthenticated = !localStorage.getItem('token');

  //redirect to dashboard if authenticated, otherwise to login
  return isAuthenticated ? (
    <Navigate to='/dashboard' />
  ) : (
    <Navigate to='/login' />
  )
}

export default App