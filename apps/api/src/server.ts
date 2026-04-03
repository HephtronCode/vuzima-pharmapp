import { app } from './app.js'
import { env } from './config.js'

const port = env.PORT ?? env.API_PORT

app.listen(port, () => {
  console.log(`Vuzima API running on http://localhost:${port}`)
})
