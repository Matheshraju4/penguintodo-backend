
import express from "express"
import { authentication } from "./routes/authentication"
import { manageTodo } from "./routes/todo"
import { manageWishlist } from "./routes/wishlist"



const app = express()

app.use(express.json())


app.use("/auth", authentication)
app.use("/todo", manageTodo)
app.use("/wishlist", manageWishlist)




app.listen(process.env.LISTEN_PORT, () => {

    console.log(`The App is running at port: http://localhost:${process.env.LISTEN_PORT}`)
})

