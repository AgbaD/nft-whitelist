export default function handler(req, res) {
    // get the tokenId from the query params
    const tokenId = req.query.tokenId;
    // As all the images are uploaded on github, we can extract the images from github directly.
    const image_url =
      "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";
    res.status(200).json({
      name: "Prytoc Dev #" + tokenId,
      description: "Prytoc Dev is a collection of developers in crypto",
      image: image_url + tokenId + ".svg",
    });
}