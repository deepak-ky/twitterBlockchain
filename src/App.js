import {
  Link,
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import React from 'react'
import ReactDOM from 'react-dom'
import { Spinner, Navbar, Nav, Button, Container } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import newlogo from "./newlogo.png"
import BlockchainTwitterAbi from "./contractsData/blockchaintwitter.json"
import BlockchainTwitterAddress from "./contractsData/blockchaintwitter-address.json"
import Home from "./Home.js"
import { ethers } from "ethers";
import Profile from "./Profile";
import './App.css'

function App() {
  const [loading,setLoading] = useState(true)
    const [account,setAccount] = useState(null)
    const [contract,setContract] = useState({})
  
    const web3Handler = async () => {
      let accounts = await window.ethereum.request({ method: 'eth_requestAccounts'});
      setAccount(accounts[0])
  
      //Setup events listners for metamask
      window.ethereum.on('chainChanged',() => {
        window.location.reload();
      })
      window.ethereum.on('accountsChanged', async () => {
        setLoading(true)
        web3Handler()
      })
  
      //Get Provider from metamask
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      //Get Signer
      const signer = provider.getSigner()
      loadContract(signer)
    }
  
    const loadContract = async (signer) => {
      //Get a deployed copy
      const contract = new ethers.Contract(BlockchainTwitterAddress.address,BlockchainTwitterAbi.abi,signer)
      setContract(contract)
      setLoading(false)
    }

  return (
     <BrowserRouter>
        <div className="App fontt">
        
            <Navbar expand="lg" bg="black" variant="dark">
              <Container>
                <Navbar.Brand>
                <img src={newlogo} width="40" height="40" /> 
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse  id="responsive-navbar-nav">
                  <Nav className="me-auto">
                      <Nav.Link as={Link} to="/">Home</Nav.Link>
                      <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                  </Nav>
                  <Nav>
                    {account ? (
                      <Nav.Link
                        href={`https://etherscan.io/address/${account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button nav-button  btn-sm mx-4">
                          <Button variant="outline-light bg-primary">
                            Account : {account.slice(0,10) + '...' + account.slice(38,42)}
                          </Button>
                        </Nav.Link>
                    ):(
                      <Button onClick={web3Handler} variant="outline-light">Connect Wallet</Button>
                    )}
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
              
          <div>
            {loading ? (
                <div  className="mx-auto" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                 <Spinner animation="border" variant="primary" style={{ position: 'relative', left:-3, top:-7}}/>
                 <div className="flex" style={{ position: 'relative', left:4, top:18}}>
                 <p className="ms-2 fontt">Awaiting Metamask connection...</p>
                 <p className="ms-4 fontt-bold">Click "Connect Wallet"</p>
                 </div>
                </div>
            ): (
              <Routes>
                <Route path="/" element={
                  <Home account={account} contract={contract} />
                } />
                <Route  path="/profile" element={
                  <Profile contract={contract} />
                }  />
              </Routes>
            )}
          </div>

        </div>
      </BrowserRouter>
 
      

  )


}

export default App;