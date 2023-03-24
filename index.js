const express = require("express");
const app = express();
const mongoose = require("mongoose");
const {v4:uuidv4} = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer")

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'uploads/')
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + "-" + file.originalname)
    }
});

const upload = multer({storage: storage});

//mongoDbConnection
const uri = "mongodb+srv://MongoDb:1@testdb.b3ypjdh.mongodb.net/?retryWrites=true&w=majority";
//mongoose
mongoose.connect(uri,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=> console.log("MongoDb Connection Başarılı!"))
.catch(err=> console.log("Hata: " + err.message));
//mongoDbConnection

//User Collection => Table
const userSchema = new mongoose.Schema({
    _id: String,
    name: String,
    lastName: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("User", userSchema);
//User Collection => Table

//Product Collection
const productSchema = new mongoose.Schema({
    _id: String,
    name: String,
    price: Number,
    image: String
});

const Product = mongoose.model("Product", productSchema);
//Product Collection

//register
app.post("/api/register", async(req, res)=>{
   const {email, password} = req.body;

   let user = new User({
    _id: uuidv4(),
    email: email,
    password: password
   });

   await user.save();

   res.json({message: "Kullanıcı kaydı başarıyla tamamlandı!"});
});
//register

//login
app.post("/api/login", async(req,res)=>{
    try {
        const {email, password} = req.body;

        const users = await User.find({email:email, password: password});
        if(users.length == 0){
            res.status(500).json({message: "Kullanıcı maili ya da şifre yanlış!"});
        }else{
            const payload = {
                id: users[0]._id,
                name: users[0].name,
                email: users[0].email
            };

            const secretKey = "Gizli anahtarım gizli anahtarım!";

            const options = {
                expiresIn: "1h"
            }

            const token = jwt.sign(payload,secretKey,options);
            
            res.json({accessToken: token});
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//products Listesi With Pagination
app.post("/api/products", async(req,res)=>{
    try {
        const {pageNumber, pageSize} = req.body;

        const products = await Product.find({})
        .skip((pageNumber-1)* pageSize)
        .limit(pageSize);

        const productCount = await Product.find({}).count();
        let model = {
            data: products,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPageCount: Math.ceil(productCount/pageSize),
            isFirstPage: pageNumber == 1 ? true : false,
            isLastPage: pageNumber == Math.ceil(productCount/pageSize) ? true : false
        }

        res.json({data: model});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//product ekleme
app.post("/api/product/add",upload.single("image"), async(req, res)=>{
    try {
        const {name,price} = req.body;
        const product = new Product({
            _id: uuidv4(),
            name: name,
            price: price,
            image: req.file.path
        });

        await product.save();
        res.json({message: "Ürün kaydı başarıyla tamamlanmıştır!"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
});

//mail gönderme
app.get("/api/sendmail", async (req,res)=>{
    try {
        const transporter = nodemailer.createTransport({
            host: "SMTP Adresi",
            port: 587,
            secure: true,
            html: true,
            auth: {
                user: "MAİL ADRESİ",
                pass: "ŞİFREMİZ"
            },
            tls: {
                ciphers: "SSLv3",
                rejectUnauthorized: false
            }            
        })

        const mailOptions = {
            from: "MAİLİN KİMDEN GİDECEĞİ",
            to: "KİME MAİL GİDECEĞİ",
            subject: "KONU",
            html: "MAİLİN HTML KODLARI"
        };

        transporter.sendMail(mailOptions, function(err,info){
            if(err){
                console.log(err);
            }else{
                console.log("Mail başarıyla gönderildi!");
            }
        })
    } catch (error) {
        
    }
})

//uygulamanın çalışma kodu
app.listen(5000, () => console.log("Uygulama ayağa kaltı!"));

