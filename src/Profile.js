import React from 'react'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Form, Button, Card, ListGroup, Col } from 'react-bootstrap'
import { Buffer } from 'buffer';
import axios from 'axios';
require('dotenv').config()

const Profile = ({ contract }) => {
    const [profile, setProfile] = useState('')
    const [nfts, setNfts] = useState('')
    const [avatar, setAvatar] = useState(null)
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(true)
    const loadMyNFTs = async () => {
        //Get user nft ids
        const results = await contract.getMyNfts();
        //Fetch metadata of each nft and add that nft object
        let nfts = await Promise.all(results.map(async i => {
            //get uri url from nft
            const uri = await contract.tokenURI(i);
            //fetch nft metadata
            const response = await fetch(uri)
            const metadata = await response.json()
            return ({
                id: i,
                username: metadata.username,
                avatar: metadata.avatar
            })
        }))
        setNfts(nfts)
        getProfile(nfts)
    }

    const getProfile = async (nfts) => {
        const address = await contract.signer.getAddress()
        const id = await contract.profiles(address)
        const profile = nfts.find((i) => i.id.toString() === id.toString())
        setProfile(profile)
        setLoading(false)
    }

    const uploadToIPFS = async (event) => {
        event.preventDefault()
        const file = event.target.files[0]
        if (typeof file !== 'undefined') {
            try {
                const formData = new FormData();
                formData.append("file", file);

                const result = await axios({
                    method: "post",
                    url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    data: formData,
                    headers: {
                        'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
                        'pinata_secret_api_key': process.env.REACT_APP_PINATA_API_SECRET,
                        "Content-Type": "multipart/form-data"
                    },
                });

               setAvatar(`https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`)
            } catch (error) {
                console.log(error)
                window.alert("ipfs image upload error: ", error)
            }
        }
    }

    const mintProfile = async (event) => {
        if (!avatar || !username) return
        try {

            const result = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: {
                    avatar: avatar,
                    username: username
                },
                headers: {
                    'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.REACT_APP_PINATA_API_SECRET,
                    "Content-Type": "application/JSON"
                },
            });

            setLoading(true)
            await (await contract.mint(`https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`)).wait()
            loadMyNFTs()
        } catch (error) {
            window.alert("ipfs uri upload error: ", error)
        }
    }

    const switchProfile = async (nft) => {
        setLoading(true)
        await (await contract.setProfile(nft.id)).wait()
        getProfile(nfts)
    }

    useEffect(() => {
        if (!nfts) {
            loadMyNFTs()
        }
    })
    if (loading) return (
        <div className='text-center'>
            <main style={{ padding: "1rem 0" }}>
                <h2>Loading...</h2>
            </main>
        </div>
    )


    return (
        <div  className="mt-4 text-center">
            {profile ? (
                <div className="mb-3" >
                    <h3 className="mb-3" >{profile.username}</h3>
                    <img className="mb-3"  style={{ width: '300px'}} src={profile.avatar} />
                </div>
            ) : <h4 className="mb-4"> No NFT profile. Please create one</h4>}


            <div className='row'>
                <main role="main" className='col-lg-12 mx-auto' style={{ maxWidth: '1000px' }}>
                    <div className='content mx-auto'>
                        <Row className='g-4'>
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadToIPFS}
                            />
                            <Form.Control onChange={(e) => setUsername(e.target.value)} size="lg" required type='text' placeholder='Username' />
                            <div className='d-grid px-0'>
                                <Button onClick={mintProfile} variant="primary" size="lg">
                                    Mint NFT Profile
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
            <div className='px-5 container'>
                <Row xs={1} md={2} lg={4}  className="g-4 py-5" >
                    {nfts.map((nft, idx) => {
                        if (nft.id === profile.id) return
                        return (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant='top' style={{ height: '300px'}} src={nft.avatar} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{nft.username}</Card.Title>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div>
                                            <Button onClick={() => switchProfile(nft)} variant="primary" size="lg">
                                                 Set as Profile
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            </div>


        </div>
    )
}

export default Profile