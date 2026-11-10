export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          answer: Json | null
          completed_at: string | null
          created_at: string
          embedding_model: string
          error: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          prompt_version: string
          question: string
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          answer?: Json | null
          completed_at?: string | null
          created_at?: string
          embedding_model: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          prompt_version: string
          question: string
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          answer?: Json | null
          completed_at?: string | null
          created_at?: string
          embedding_model?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          prompt_version?: string
          question?: string
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          document_version: number
          embedding: string
          embedding_model: string
          fts: unknown
          id: string
          page_number: number | null
          section: string | null
          token_estimate: number
          workspace_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          document_version: number
          embedding: string
          embedding_model: string
          fts?: unknown
          id?: string
          page_number?: number | null
          section?: string | null
          token_estimate: number
          workspace_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          document_version?: number
          embedding?: string
          embedding_model?: string
          fts?: unknown
          id?: string
          page_number?: number | null
          section?: string | null
          token_estimate?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chunk_count: number
          created_at: string
          file_name: string
          file_type: string
          id: string
          is_demo: boolean
          page_count: number | null
          sha256: string
          size_bytes: number
          status: Database["public"]["Enums"]["document_status"]
          status_detail: string | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string
          version: number
          workspace_id: string
        }
        Insert: {
          chunk_count?: number
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          is_demo?: boolean
          page_count?: number | null
          sha256: string
          size_bytes: number
          status?: Database["public"]["Enums"]["document_status"]
          status_detail?: string | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by: string
          version?: number
          workspace_id: string
        }
        Update: {
          chunk_count?: number
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          is_demo?: boolean
          page_count?: number | null
          sha256?: string
          size_bytes?: number
          status?: Database["public"]["Enums"]["document_status"]
          status_detail?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      run_citations: {
        Row: {
          chunk_id: string | null
          created_at: string
          document_id: string | null
          document_title: string
          document_version: number
          id: string
          marker: number
          page_number: number | null
          passage: string
          run_id: string
          section: string | null
          workspace_id: string
        }
        Insert: {
          chunk_id?: string | null
          created_at?: string
          document_id?: string | null
          document_title: string
          document_version: number
          id?: string
          marker: number
          page_number?: number | null
          passage: string
          run_id: string
          section?: string | null
          workspace_id: string
        }
        Update: {
          chunk_id?: string | null
          created_at?: string
          document_id?: string | null
          document_title?: string
          document_version?: number
          id?: string
          marker?: number
          page_number?: number | null
          passage?: string
          run_id?: string
          section?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_citations_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_citations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_citations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_citations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      run_steps: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          input: Json | null
          kind: string
          name: string
          output: Json | null
          run_id: string
          status: string
          step_index: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: Json | null
          kind: string
          name: string
          output?: Json | null
          run_id: string
          status: string
          step_index: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: Json | null
          kind?: string
          name?: string
          output?: Json | null
          run_id?: string
          status?: string
          step_index?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_steps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write_workspace: { Args: { _ws: string }; Returns: boolean }
      hybrid_search: {
        Args: {
          _match_count?: number
          _query_embedding: string
          _query_text: string
          _workspace_id: string
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          document_title: string
          document_version: number
          keyword_rank: number
          page_number: number
          score: number
          section: string
          semantic_rank: number
          similarity: number
        }[]
      }
      is_workspace_member: { Args: { _ws: string }; Returns: boolean }
    }
    Enums: {
      document_status:
        | "uploaded"
        | "parsing"
        | "chunking"
        | "embedding"
        | "ready"
        | "failed"
      workspace_role: "owner" | "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_status: [
        "uploaded",
        "parsing",
        "chunking",
        "embedding",
        "ready",
        "failed",
      ],
      workspace_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
