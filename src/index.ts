import { AppServer, AppSession, StreamType, ViewType, type AudioChunk } from '@mentra/sdk';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => {throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');

class MentraOSApp extends AppServer{
    // private audioChunks: ArrayBuffer[] = [];
    // private isRecording = false;

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

        session.events.onVoiceActivity((data) => {
            console.log('🎤 VAD:', data.status);
          });

        // session.events.onAudioChunk((chunk) => {
        //     if (this.isRecording) {
        //         this.audioChunks.push(chunk.arrayBuffer);
        //         console.log(`Chunk received: ${chunk.arrayBuffer.byteLength} bytes`);
        //     }
        // });

        // session.events.onButtonPress((data) => {
        //     if(data.buttonId === 'select' && data.pressType === 'short'){
        //         this.audioChunks = [];
        //         this.isRecording = true;
        //         session.layouts.showTextWall('Recording...');
        //         console.log('Recording started');   
        //     }
        // })        

        session.events.onTranscription(async(data) => {

            console.log('Transcription received:', data.text, 'isFinal:', data.isFinal);
            if(!data.isFinal) return;
            
            const command = data.text.toLowerCase();
            console.log('🎯 Processing command:', command);

            if(command.includes("hey, what's your name") || command.includes("hey, whats your name")){
                    try{
                        session.layouts.showTextWall('Photo captured')
                        await session.audio.speak("Photo captured")
                        const photo = await session.camera.requestPhoto();
                        console.log(`Photo captured: ${photo.filename}`);
                    }catch(err){
                        console.error('Failed to capture photo', err);
                    }
            }
        });

        await session.audio.speak("Visage has started");
    }
    // private async uploadPhotoToAPI(buffer: Buffer, mimeType: string):Promise<void>{
    //     const formData = new FormData();
    //     formData.append('photo', new Blob([buffer], {type: mimeType}));
    //     await fetch('/api/upload', {method: 'POST', body: formData})
    // }
    
    // private async uploadAudioChunk(buffer: Buffer, mimeType: string):Promise<void>{
    //     buffer = audioBuffer
    // }
    
}

const app = new MentraOSApp();
app.start().catch(console.error);