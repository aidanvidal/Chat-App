import multiprocessing
import subprocess

def run_websocket_server():
    subprocess.run(["python", "server.py"])

def run_http_server():
    subprocess.run(["python", "http_server.py"])

if __name__ == "__main__":
    # Create two processes
    websocket_process = multiprocessing.Process(target=run_websocket_server)
    http_process = multiprocessing.Process(target=run_http_server)

    # Start both processes
    websocket_process.start()
    http_process.start()

    print("Both servers are running. Press Ctrl+C to stop.")

    try:
        # Wait for both processes to complete (which they won't, unless stopped)
        websocket_process.join()
        http_process.join()
    except KeyboardInterrupt:
        print("Stopping servers...")
        # Terminate both processes
        websocket_process.terminate()
        http_process.terminate()
        # Wait for them to finish``
        websocket_process.join()
        http_process.join()
        print("Servers stopped.")