import { AppServer, AppSession, ViewType } from '@mentra/sdk';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => {throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');

class MentraOSApp extends AppServer{
    constructor(){
        super({
            packageName: PACKAGE_NAME,
            apiKey: MENTRAOS_API_KEY,
            port: PORT,
        })
    }

    protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void>{
        console.log("App has begun running");

        session.events.onTranscription((data) => {
            if(!data.isFinal) return;
            
            const command = data.text.toLowerCase();

            if(command.includes('whats your name')){
                (async () =>{
                    try{
                        const photo = await session.camera.requestPhoto();
                        console.log(`Photo captured: ${photo.filename}`);
                    }catch(err){
                        console.error('Failed to capture photo', err);
                    }
                })();
            }
        })
    }

    private async processPhoto(session: AppSession, photo): Promise<void>{

    }
}

const app = new MentraOSApp();
app.start().catch(console.error);