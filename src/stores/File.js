import { defineStore } from "pinia";

export const useFileStores = defineStore("file", {
    state: () => ({
        FileId: null,
    }),
    actions: {
        setFileId(id) {
            this.FileId = id;
            localStorage.setItem("fileIdnihcuii", this.FileId)
        }, getFileId() {
            return this.FileId;
        }, removeFileId() {
            this.FileId = null;
        }
    }
})