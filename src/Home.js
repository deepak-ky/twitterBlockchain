import { useState, useEffect } from 'react'
import { Row, Form, Button, Card, ListGroup } from 'react-bootstrap'
import React from 'react'
import { ethers } from 'ethers'
import { Buffer } from 'buffer';
import axios from 'axios';
require('dotenv').config()


const Home = ({ account, contract }) => {
    const [loading, setLoading] = useState(true)
    const [hasProfile, setHasProfile] = useState(false)
    const [address, setAddress] = useState('')
    const [posts, setPosts] = useState('')
    const [post, setPost] = useState('')
    const loadPosts = async () => {
        //Get user's address
        let addr = await contract.signer.getAddress()
        setAddress(addr)
        //Check if user owns a nft
        // and if they do set profile to be true
        const balance = await contract.balanceOf(account)
        setHasProfile(() => balance > 0)
        //Get all posts
        let results = await contract.getAllPosts()
        //Fetch metadata from each post and add that to the post object
        let posts = await Promise.all(results.map(async i => {
            //use hash to fetch the post's metadata stored on ipfs
            let response = await fetch(`https://gateway.pinata.cloud/ipfs/${i.hash}`)
            const metaDataPost = await response.json()
            //get authors nft profile
            const nftId = await contract.profiles(i.author)
            //get uri url of the nft profile
            const uri = await contract.tokenURI(nftId)
            //fetch nft profile metadata
            response = await fetch(uri)
            const metaDataProfile = await response.json()
            //define author object
            const author = {
                address: i.author,
                username: metaDataProfile.username,
                avatar: metaDataProfile.avatar
            }
            //define a post object
            let post = {
                id: i.id,
                content: metaDataPost.post,
                tipAmount: i.tipAmount,
                author
            }
            return post
        }))
        posts = posts.sort((a, b) => b.tipAmount - a.tipAmount)
        //Sort posts from most tipped to least tipped
        setPosts(posts)
        setLoading(false)
    }
    useEffect(() => {
        if (!posts) {
            loadPosts()
        }
    })

    const uploadPost = async () => {
        if (!post) return
        let hash
        //Upload post to IPFS
        try {

            const result = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: {
                    post: post,
                },
                headers: {
                    'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.REACT_APP_PINATA_API_SECRET,
                    "Content-Type": "application/JSON"
                },
            });

            setLoading(true)
            hash = result.data.IpfsHash
        } catch (error) {
            window.alert("ipfs image upload error: ", error)
        }

        //upload post to blockchain
        await (await contract.uploadPost(hash)).wait()
        loadPosts()
    }

    const tip = async (post) => {
        //tip post owner
        await (await contract.tipPostOwner(post.id, { value: ethers.utils.parseEther("0.1") })).wait()
        loadPosts()
    }
    if (loading) return (
        <div className='text-center'>
            <main style={{ padding: "1rem 0" }}>
                <h2>Loading...</h2>
            </main>
        </div>
    )
    return (
        <div className="container-fluid mt-5">
            {hasProfile ?
                (<div className="row">
                    <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                        <div className="content mx-auto">
                            <Row className="g-4">
                                <Form.Control onChange={(e) => setPost(e.target.value)} size='lg' required as='textarea' />
                                <div>
                                    <Button onClick={uploadPost} variant='primary' size='lg' > Post! </Button>
                                </div>
                            </Row>
                        </div>
                    </main>
                </div>)
                : (
                    <div className="text-center">
                        <main style={{ padding: "1rem 0" }}>
                            <h2>Must Own a NFT to Post</h2>
                        </main>
                    </div>
                )
            }

            <p>&nbsp;</p>
            <hr />
            <p className="my-auto">&nbsp;</p>
            {posts.length > 0 ? 
                posts.map((post,key) => {
                return (
                <div  className="col-lg-12 my-3 mx-auto" style={{ maxWidth: '1000px' }}>
                    <Card>
                        <Card.Header>
                            <img  className='mr-2' width='30' height='30' src={post.author.avatar} />
                            <small className='ms-2 me-auto d-inline' >{post.author.username}</small>
                            <small className='mt-1 float-end d-inline' >{post.author.address}</small>
                        </Card.Header>
                        <Card.Body color='secondary' >
                            <Card.Title>
                                {post.content}
                            </Card.Title>
                        </Card.Body>
                        <Card.Footer className='list-group-item' >
                            <div className='d-inline mt-auto float-start' >Tip Amount: {ethers.utils.formatEther(post.tipAmount)} ETH</div>
                            {address == post.author.address || !hasProfile ? 
                                null :
                                <div className='d-inline float-end' >
                                    <Button onClick={() => tip(post)} variant="outline-primary">
                                        Tip for 0.1 ETH
                                    </Button>
                                </div>
                            }
                        </Card.Footer>
                    </Card>
                </div>
            )}) :
                (
                    <div className='text-center'>
                        <main style={{ padding: "1rem 0" }}>
                            <h2>No Posts Yet</h2>
                        </main>
                    </div>
                )

            }
        </div>
    )
}

export default Home