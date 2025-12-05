import { AppServer, AppSession} from '@mentra/sdk';
import FormData from 'form-data';

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

    protected override async onSession(session: AppSession, sessionId: string, userId: string): Promise<void>{
        session.layouts.showTextWall("App has started")
        console.log("App has begun running");

        session.events.onTranscription(async(data) => {
            console.log('Transcription received:', data.text, 'isFinal:', data.isFinal);
        
            if (this.isCollecting && data.isFinal) {
                const text = data.text.toLowerCase();
                
                if (text.includes("nice to meet you") || text.includes("nice meeting you") || text.includes("catch you later")) {
                    this.isCollecting = false;
                    const fullConversation = this.conversationBuffer.join(' ');
                    console.log('📝 Farewell detected! Conversation:', fullConversation);
                    session.layouts.showTextWall(`Heard: ${fullConversation}`);
                    // TODO: Send to Gemini
                    this.conversationBuffer = [];
                    return;
                }
            
                this.conversationBuffer.push(data.text);
                console.log('📝 Buffered:', data.text);
                return;
            }

            if(!data.isFinal) return;
            
            const command = data.text.toLowerCase();
            console.log('🎯 Processing command:', command);

            

            // Trigger phrase to start collecting
            if(command.includes("hey, what's your name") || command.includes("hey, whats your name")){
                if (!session.capabilities?.hasCamera) {
                    console.error('No camera available');
                    return;
                }
                try {
                    this.isCollecting = true;
                    this.conversationBuffer = [];
                    
                    console.log('Starting photo request...');
                    session.camera.requestPhoto({
                        size: 'small',
                        compress: 'medium'
                    })
                        .then(async photo => {
                            console.log(`Photo captured: ${photo.filename}`)
                            await session.audio.speak("Photo Captured")
                        })
                        .catch(err => {
                            console.error("Photo failed", err);
                        });
                    session.layouts.showTextWall('Visage is listening...');

                    setTimeout(async () => {
                        if (this.isCollecting) {
                            this.isCollecting = false;
                            const fullConversation = this.conversationBuffer.join(' ');
                            console.log('📝 Timeout! Conversation:', fullConversation);
                            session.layouts.showTextWall(`Heard: ${fullConversation}`);
                            // TODO: Send to Gemini
                            this.conversationBuffer = [];
                        }
                    }, 20000);

                } catch(err) {
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
