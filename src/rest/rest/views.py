from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId
import os

class AuthenticationError(Exception):
    def __init__(self, message="Authentication failed"):
        self.message = message
        super().__init__(self.message)

mongo_uri = 'mongodb://' + os.environ["MONGO_HOST"] + ':' + os.environ["MONGO_PORT"]
client = MongoClient(mongo_uri)
db = client['test_db']
todos_collection = db["todos"]

def get_user_id_from_request(request):
    user_id = request.headers.get('X-User-ID')
    if not user_id or not isinstance(user_id, str) or not user_id.strip():
        raise AuthenticationError("Valid X-User-ID header is required")
    return user_id.strip()

class TodoListView(APIView):

    def get(self, request):
        try:
            user_id = get_user_id_from_request(request)

            todos = list(todos_collection.find(
                {"user_id": user_id},
                {'_id': 1, 'description': 1, 'completed': 1}
            ))

            for todo in todos:
                todo['_id'] = str(todo['_id'])

            return Response(todos, status=status.HTTP_200_OK)
        
        except AuthenticationError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:

            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            user_id = get_user_id_from_request(request)
            data = request.data

            if not data or 'description' not in data:
                return Response({"error": "description is required"}, status=status.HTTP_400_BAD_REQUEST)

            description = str(data['description']).strip()

            if not description:
                return Response({"error": "description cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

            todo_doc = {
                "user_id": user_id,
                "description": description,
                "completed": False
            }

            result = todos_collection.insert_one(todo_doc)

            new_todo = {
                "_id": str(result.inserted_id),
                "description": description,
                "completed": False
            }

            return Response(new_todo, status=status.HTTP_201_CREATED)
        
        except AuthenticationError as e:

            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        
        except Exception as e:

            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request):
        try:
            user_id = get_user_id_from_request(request)
            data = request.data

            if not data or 'id' not in data:
                return Response({"error": "id is required in request body"}, status=status.HTTP_400_BAD_REQUEST)

            todo_id = data['id']
            try:
                obj_id = ObjectId(todo_id)

            except Exception:
                return Response({"error": "Invalid todo id format"}, status=status.HTTP_400_BAD_REQUEST)

            existing = todos_collection.find_one({"_id": obj_id})

            if not existing:
                return Response({"error": "Todo not found"}, status=status.HTTP_404_NOT_FOUND)
            if existing.get("user_id") != user_id:
                return Response({"error": "You can only update your own todos"}, status=status.HTTP_403_FORBIDDEN)

            update_fields = {}

            if 'description' in data:
                desc = str(data['description']).strip()
                if not desc:
                    return Response({"error": "description cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
                update_fields['description'] = desc

            if 'completed' in data:
                if not isinstance(data['completed'], bool):
                    return Response({"error": "completed must be boolean"}, status=status.HTTP_400_BAD_REQUEST)
                update_fields['completed'] = data['completed']

            if not update_fields:
                return Response({"error": "No valid fields to update"}, status=status.HTTP_400_BAD_REQUEST)

            result = todos_collection.update_one(
                {"_id": obj_id},
                {"$set": update_fields}
            )

            if result.modified_count == 0:
                return Response({"error": "No changes applied"}, status=status.HTTP_400_BAD_REQUEST)

            updated_todo = todos_collection.find_one({"_id": obj_id})

            updated_todo['_id'] = str(updated_todo['_id'])

            return Response(updated_todo, status=status.HTTP_200_OK)

        except AuthenticationError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:

            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        try:
            user_id = get_user_id_from_request(request)
            data = request.data

            if not data or 'id' not in data:
                return Response({"error": "id is required in request body"}, status=status.HTTP_400_BAD_REQUEST)

            todo_id = data['id']
            try:
                obj_id = ObjectId(todo_id)
            except Exception:
                return Response({"error": "Invalid todo id format"}, status=status.HTTP_400_BAD_REQUEST)

            existing = todos_collection.find_one({"_id": obj_id})

            if not existing:
                return Response({"error": "Todo not found"}, status=status.HTTP_404_NOT_FOUND)
            if existing.get("user_id") != user_id:
                return Response({"error": "You can only delete your own todos"}, status=status.HTTP_403_FORBIDDEN)

            result = todos_collection.delete_one({"_id": obj_id})

            if result.deleted_count == 0:
                return Response({"error": "Failed to delete"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(status=status.HTTP_204_NO_CONTENT)


        except AuthenticationError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:

            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)