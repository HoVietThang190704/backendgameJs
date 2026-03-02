export class BaseResponse<T> {
    private status: number = 500;
    private message: string = '';
    private success: boolean = false;
    private data!: T;

    constructor() {}

    setResponse(status: number) {
        this.status = status;
        return this;
    }

    setMessage(message: string) {
        this.message = message;
        return this;
    }

    setSuccess(success: boolean) {
        this.success = success;
        return this;
    }

    setData(data: T) {
        this.data = data;
        return this;
    }

    getStatus(): number {
        return this.status;
    }

    getMessage(): string {
        return this.message;
    }

    isSuccess(): boolean {
        return this.success;
    }

    build(): BaseResponse<T> {
        return this;
    }

    toJSON(): { status: number; message: string; success: boolean; data: T } {
        return {
            status: this.status,
            message: this.message,
            success: this.success,
            data: this.data,
        }
    }
}