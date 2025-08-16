import os
import pandas as pd # Used for offset_map loading if done here, but primarily in app.py
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredFileLoader, UnstructuredMarkdownLoader 
from langchain.text_splitter import RecursiveCharacterTextSplitter 
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS 

# Import configurations from config.py
import config

# --- RAG Builder Functions ---
def build_or_load_rag_knowledge_base(embedding_model_instance: GoogleGenerativeAIEmbeddings) -> FAISS:
    """
    Builds or loads the FAISS vector store for RAG.
    """
    print("\n--- Building/Loading RAG Knowledge Base (with FAISS Persistence) ---")

    # Check if FAISS index already exists on disk
    faiss_index_exists = os.path.exists(config.FAISS_INDEX_PATH) and os.listdir(config.FAISS_INDEX_PATH)

    if faiss_index_exists and not config.REBUILD_FAISS_INDEX:
        print(f"Loading existing FAISS index from {config.FAISS_INDEX_PATH}...")
        try:
            vectorstore = FAISS.load_local(config.FAISS_INDEX_PATH, embedding_model_instance, allow_dangerous_deserialization=True) 
            print("FAISS index loaded successfully and contains data.")
        except Exception as e:
            print(f"Error loading FAISS index: {e}. Rebuilding from scratch.")
            faiss_index_exists = False 

    if not faiss_index_exists or config.REBUILD_FAISS_INDEX: 
        print("No existing valid FAISS index found or rebuilding forced. Building from scratch...")
        
        # Load Solution Documents
        solution_doc_files_to_load = []
        if not os.path.exists(config.SOLUTION_DOCS_DIR):
            print(f"ERROR: Solution documents directory not found at {config.SOLUTION_DOCS_DIR}. RAG will not have context.")
        else:
            for root, _, files in os.walk(config.SOLUTION_DOCS_DIR):
                for file in files:
                    file_path = os.path.join(root, file)
                    if file_path.endswith('.pdf'):
                        loader = PyPDFLoader(file_path) 
                    elif file_path.endswith(('.txt', '.md', '.html', '.docx', '.xlsx')):
                        loader = UnstructuredFileLoader(file_path) 
                    else:
                        print(f"Skipping unsupported file type: {file_path}")
                        continue
                    try:
                        docs = loader.load()
                        solution_doc_files_to_load.extend(docs)
                        print(f"Loaded {len(docs)} pages/chunks from {os.path.basename(file_path)}")
                    except Exception as e:
                        print(f"ERROR: Could not load {file_path}: {e}")

        print(f"\nTotal raw documents loaded for RAG: {len(solution_doc_files_to_load)}")
        if not solution_doc_files_to_load:
            print("WARNING: No solution documents were loaded. RAG will not have context.")

        # Split Documents into Chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,     # Size of each chunk
            chunk_overlap=200,   # Overlap between chunks to maintain context
            length_function=len  # Use character length
        )
        rag_chunks = text_splitter.split_documents(solution_doc_files_to_load)
        print(f"Split into {len(rag_chunks)} chunks for RAG.")

        if not rag_chunks:
            print("WARNING: No chunks created for RAG. Check document loading or text splitter settings.")

        # Create Embeddings and Store in FAISS
        print(f"Creating embeddings and storing in FAISS (in-memory and saving to disk at {config.FAISS_INDEX_PATH})...")
        vectorstore = FAISS.from_documents(
            documents=rag_chunks,
            embedding=embedding_model_instance
        )
        vectorstore.save_local(config.FAISS_INDEX_PATH) 
        print("Embeddings created and stored in FAISS, and saved to disk.")

    return vectorstore.as_retriever()