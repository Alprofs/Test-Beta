const DataStore = {
    userProgress: {
        xp: 0,
        completedLectures: []
    },
    lectures: [],
    getLectureById(id) {
        return this.lectures.find(l => l.id === parseInt(id));
    }
};