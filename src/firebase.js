import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDXSrRWFlVQvsAgrMTifWQ9FJp34nA4yUk",
    authDomain: "theotokosmobileapp.firebaseapp.com",
    databaseURL: "https://theotokosmobileapp-default-rtdb.firebaseio.com",
    projectId: "theotokosmobileapp",
    storageBucket: "theotokosmobileapp.appspot.com",
    messagingSenderId: "773452189288",
    appId: "1:773452189288:web:327cdcc2f8c71d72ebf5dd",
    measurementId: "G-2W0JE8SSQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
