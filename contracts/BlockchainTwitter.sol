//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Blockchaintwitter is ERC721URIStorage {
    //For these variables , or state variables , memory is persisted because they are stored on the blockchain
    uint256 public tokenCount;
    uint256 public postCount;

    mapping(uint256 => Post) public posts; 
    // address --> nft id
    mapping(address => uint256) public profiles;

    struct Post{
        uint256 id;
        string hash;
        uint256  tipAmount;
        address payable author;
    }

    // Emit an event => logged data to the blockchain, external entities can query this dat
    event PostCreated(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author 
    );

    event PostTipped(
         uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author 
    );

     constructor() ERC721("Blockchaintwitter", "deepak_ky") {}

     //mint creates a new nft ,and it will be minted for the address that calls the function
    // _tokenURI only exits , in durations of this function call
    function mint(string memory _tokenURI) external returns (uint256) {
        tokenCount++;
        _safeMint(msg.sender,tokenCount);
        _setTokenURI(tokenCount,_tokenURI);
        setProfile(tokenCount);
        return tokenCount;
    }

    function setProfile(uint256 _id) public{
        require(
            ownerOf(_id) == msg.sender,
            "Must own the nft you want to select as your profile"
        );
        profiles[msg.sender] = _id;
    }

    function uploadPost(string memory _postHash) external{
        require(
            balanceOf(msg.sender) > 0,
            "Must own a nft to post"
        );
        require(bytes(_postHash).length>0,"Cannot pass an empty hash");
        postCount++;
        posts[postCount] = Post(postCount,_postHash,0,payable(msg.sender));
        //Trigger an event 
        emit PostCreated(postCount,_postHash,0,payable(msg.sender));
    }

    function tipPostOwner(uint256 _id) external payable{
        require(_id>0 && _id<=postCount,"Invalid Post Id");
        Post memory _post = posts[_id];
        require(_post.author != msg.sender,"Cannot Tip your own post");
        //Transfer ether to post author
        _post.author.transfer(msg.value);
        //Increment the tip amount
        _post.tipAmount += msg.value;
        //Update the image
        posts[_id] = _post;
        emit PostTipped(_id, _post.hash, _post.tipAmount, _post.author);

    }

    function getAllPosts() external view returns (Post[] memory _posts){
        //In memory array have to be of fixed length, they cannot be of dynamic length
        _posts = new Post[](postCount);
        for(uint256 i=0;i<_posts.length;i++){
            _posts[i] = posts[i+1];
        }
    }

    function getMyNfts() external view returns (uint256[] memory _ids){
        //balanceOf will give the number of nfts the current owner holds
        _ids = new uint256[](balanceOf(msg.sender));
        uint256 currentIndex;
        uint256 _tokenCount = tokenCount;
        for(uint256 i=0;i<_tokenCount;i++){
            if(ownerOf(i+1) == msg.sender){
                _ids[currentIndex] = i+1;
                currentIndex++;
            }
        }
    } 

   
}
