import { AppServer, AppSession} from '@mentra/sdk';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => {throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');


class MentraOSApp extends AppServer{
    private conversationBuffer: string[] = []
    private isCollecting = false;

    constructor(){
        super({
            packageName: PACKAGE_NAME,
            apiKey: MENTRAOS_API_KEY,
            port: PORT,
        })
    }

    protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void>{
        session.layouts.showTextWall("App has started")
        console.log("App has begun running");

        session.events.onTranscription(async(data) => {

            console.log('Transcription received:', data.text, 'isFinal:', data.isFinal);
            if(!data.isFinal) return;
            
            const command = data.text.toLowerCase();
            console.log('🎯 Processing command:', command);

            if(command.includes("hey, what's your name") || command.includes("hey, whats your name")){
                    try{
                        this.isCollecting = true;
                        this.conversationBuffer = [];

                        session.layouts.showTextWall('Visage is listening...')
                        session.layouts.showTextWall('Photo captured')
                        await session.audio.speak("Photo captured")
                        const photo = await session.camera.requestPhoto();
                        console.log(`Photo captured: ${photo.filename}`);

                        if(command.includes("nice to meet you") || command.includes("it was nice meeting you") || command.includes("ill catch you later")){
                            this.isCollecting = false;
                        }
                        else{
                            setTimeout(async () => {
                                this.isCollecting = false;
                                const fullConversation = this.conversationBuffer.join(' ');
                                console.log('📝Full conversation', fullConversation);
                                session.layouts.showTextWall(`Heard: ${fullConversation}`);
    
                                this.conversationBuffer = [];
                            }, 20000);
                        }
                    }catch(err){
                        console.error('Failed to capture photo', err);
                    }
            }
        });

        await session.audio.speak("Visage has started");
    }
    private async uploadPhotoToAPI(photo: {filename: string, buffer: Buffer, mimeType?: string }):Promise<void>{
        const formData = new FormData();
        formData.append('photo', new Blob([photo.buffer], {type: photo.mimeType || 'image/jpeg'}), photo.filename);
        const response = await fetch('http://localhost:8000/api/scan', {method: 'POST', body: formData});

        if(!response.ok){
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('Upload result', result); 
    }
       
}

const app = new MentraOSApp();
app.start().catch(console.error);