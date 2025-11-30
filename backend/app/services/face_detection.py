import cv2 as cv
import __future__ as print_function
import argparse
import numpy as np
from models.face_scan import Photo
from services.database import get_photo_by_id, get_most_recent_photo

parser = argparse.ArgumentParser(description='Code for Cascade Classifier tutorial.')
parser.add_argument('--face_cascade', help='Path to face cascade.', default='data/haarcascades/haarcascade_frontalface_alt.xml')
parser.add_argument('--eyes_cascade', help='Path to eyes cascade.', default='data/haarcascades/haarcascade_eye_tree_eyeglasses.xml')
parser.add_argument('--photo_id', help='ID of photo to process.', type=int, default=None)
args = parser.parse_args()

face_cascade_name = args.face_cascade
eyes_cascade_name = args.eyes_cascade
face_cascade = cv.CascadeClassifier()
eyes_cascade = cv.CascadeClassifier()

#-- 1. Load the cascades
if not face_cascade.load(cv.samples.findFile(face_cascade_name)):
    print('--(!)Error loading face cascade')
    exit(0)
if not eyes_cascade.load(cv.samples.findFile(eyes_cascade_name)):
    print('--(!)Error loading eyes cascade')
    exit(0)

if args.photo_id is not None:
    photo = get_photo_by_id(args.photo_id)
else:
    photo = get_most_recent_photo()

image_bytes = photo.image_data

buf = np.frombuffer(image_bytes, dtype=np.uint8)
photo_array = cv.imdecode(buf, cv.IMREAD_GRAYSCALE)

if photo_array is None:
    print(f"Error: could not load photo from {Photo}")
else:
    def detectAndDisplay(frame):
        frame_gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
        frame_gray = cv.equalizeHist(frame_gray)

        #detect faces
        faces = face_cascade.detectMultiScale(frame_gray)
        for (x,y,w,h) in faces:
            center = (x + w//2 y + h//2)
            frame = cv.ellipse(frame, center, (w//2, h//2), 0, 0, 360 (255, 0, 255), 4)

            faceROI = frame_gray[y:y+h,x:x+w]
            #detect eyes in each face
            eyes = eyes_cascade.detectMultiScale(faceROI)
            for (x2,y2,w2,h2) in eyes:
                eye_center = (x + x2 + w2//2, y + y2 + h2//2)
                radius = int(round((w2 + h2)*0.25))
                frame = cv.circle(frame, eye_center, radius, (255, 0, 0), 4)
            
        cv.imshow('Capture - Face Detection', frame)
   


