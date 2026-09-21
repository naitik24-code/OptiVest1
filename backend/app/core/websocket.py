from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id is not None:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id is not None and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
            
        data = json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **message
        })
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(data)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                self.disconnect(connection)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id not in self.user_connections:
            return
            
        data = json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **message
        })
        for connection in self.user_connections[user_id].copy():
            try:
                await connection.send_text(data)
            except Exception as e:
                logger.error(f"Error sending personal message: {e}")
                self.disconnect(connection, user_id)

websocket_manager = ConnectionManager()
