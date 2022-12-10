const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockchainTwitter", function () {
    let blockchaintwitter
    let deployer, user1, user2, users
    let URI = "SampleURI"
    let postHash = "SampleHash"
    beforeEach(async () => {
        //Get signers from development accounts
        [deployer,user1,user2,...users] = await ethers.getSigners();
        // We get the contract factory to deploy the account
        const BlockchaintwitterFactory = await ethers.getContractFactory("Blockchaintwitter");
        // Deploy contract
        blockchaintwitter = await BlockchaintwitterFactory.deploy();
         //user1 mints an nfts
         await blockchaintwitter.connect(user1).mint(URI)
    })
    describe('Deployment',async () => {
        it("Should track name and symbol",async function() {
            const nftName = "Blockchaintwitter"
            const nftSymbol = "deepak_ky"
            expect(await blockchaintwitter.name()).to.equal(nftName);
            expect(await blockchaintwitter.symbol()).to.equal(nftSymbol);
        });
    })
    describe('Minting NFTs',async () => { 
        it("Should track each minted NFT",async function() {
            expect(await blockchaintwitter.tokenCount()).to.equal(1);
            //balance of gives the amount of nft's that user1.address holds
            expect(await blockchaintwitter.balanceOf(user1.address)).to.equal(1);
            expect(await blockchaintwitter.tokenURI(1)).to.equal(URI);

            await blockchaintwitter.connect(user2).mint(URI)
            expect(await blockchaintwitter.tokenCount()).to.equal(2);
            expect(await blockchaintwitter.balanceOf(user2.address)).to.equal(1);
            expect(await blockchaintwitter.tokenURI(2)).to.equal(URI);
        });
    })
    describe('Setting Profiles',async () => { 
        it("Should allow the users to select which NFT they own to represent thier profile",async function() {
            //User 1 mints another nft
            await blockchaintwitter.connect(user1).mint(URI)
            //By default the users profile is set to their last minted nft
            expect(await blockchaintwitter.profiles(user1.address)).to.equal(2);
            //user1 sets profile to first minted nft
            await blockchaintwitter.connect(user1).setProfile(1);
            expect(await blockchaintwitter.profiles(user1.address)).to.equal(1);

            //FAIL CASE
            // user 2 tries to set their profile to nft number 2 owned by user 1
            await expect(
                blockchaintwitter.connect(user2).setProfile(2)
            ).to.be.revertedWith("Must own the nft you want to select as your profile")
        });
    })
    describe('Tipping posts', async()=>{
        it("Should allow users to tip posts and track each posts tip amout",async function(){
            //user1 uploads a post
            await blockchaintwitter.connect(user1).uploadPost(postHash)
            //Tack user1 balance before their posts get tipped
            const initAuthorBalance = await ethers.provider.getBalance(user1.address)
            //set tip amount to 1 ether
            const tipAmount = ethers.utils.parseEther("1") // 1 ether = 10^18 wei
            //user 2 tips user1's post
            await expect(blockchaintwitter.connect(user2).tipPostOwner(1,{value:tipAmount}))
                .to.emit(blockchaintwitter,"PostTipped")
                .withArgs(
                    1,
                    postHash,
                    tipAmount,
                    user1.address
                )
            //Check that tipAmount has been updated from the struct
            const post = await blockchaintwitter.posts(1)
            expect(post.tipAmount).to.equal(tipAmount)
            //check that user1 received funds
            const finalAuthorBalance = await ethers.provider.getBalance(user1.address)
            expect(finalAuthorBalance).to.equal(initAuthorBalance.add(tipAmount))
            //Fail Case #1
            //user 2 tries to post a tip that does not exist
            await expect(
                blockchaintwitter.connect(user2).tipPostOwner(2)
            ).to.be.revertedWith("Invalid Post Id");
            // //Fail Case #2
            // //user 1 tries to post a tip their own post
            await expect(
                blockchaintwitter.connect(user1).tipPostOwner(1)
            ).to.be.revertedWith("Cannot Tip your own post");
            
        });
    })
});
