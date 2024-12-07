export class Settings{
    constructor(sound = 50, difficulty = 50, tutorial = false){
        this.sound = sound;
        this.difficulty = difficulty;
        this.tutorial = tutorial;
    }

    toggleTutorial(){
        this.tutorial = !this.tutorial;
    }

    setSound(value){
        this.sound = value;
    }

    setDifficulty(value){
        this.difficulty = value;
    }
}