/*
  # Customer File Attachments System

  ## Overview
  Adds storage bucket configuration and RLS policies to enable file uploads for customer documents (images and PDFs).

  ## 1. Storage Configuration
  
  ### Storage Bucket Setup
  - Create 'uploads' bucket for storing customer documents
  - Enable public access with proper RLS policies
  - Configure for customer documents subdirectory structure

  ## 2. Storage Bucket Policies

  ### Upload Policy
  - Authenticated admin users can upload files to customer-documents folder
  - File path validation to ensure proper directory structure

  ### Read Policy
  - Authenticated admin users can view all files in uploads bucket
  - Public read access disabled for security

  ### Delete Policy
  - Authenticated admin users can delete files from customer-documents folder
  - Ensures proper file cleanup when attachments are removed

  ## 3. Indexes
  - Add indexes for faster attachment queries
  - Index on entity_type and entity_id for quick customer document lookups

  ## 4. Important Notes
  - Files stored under `customer-documents/{customer_id}/` path structure
  - Supported file types: images (jpg, png) and PDF documents
  - Maximum file size enforced on client side (10MB recommended)
  - All operations require authenticated user session
  - Attachments table links files to customers via entity_type and entity_id
  - Existing RLS policies on attachments table already configured
*/

-- Ensure the uploads bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for authenticated users (admins)

-- Policy: Admins can upload files to customer-documents folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload customer documents'
  ) THEN
    CREATE POLICY "Admins can upload customer documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'uploads' AND
      (storage.foldername(name))[1] = 'customer-documents'
    );
  END IF;
END $$;

-- Policy: Admins can view all files in uploads bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can view all uploads'
  ) THEN
    CREATE POLICY "Admins can view all uploads"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'uploads');
  END IF;
END $$;

-- Policy: Admins can delete files from customer-documents folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete customer documents'
  ) THEN
    CREATE POLICY "Admins can delete customer documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'uploads' AND
      (storage.foldername(name))[1] = 'customer-documents'
    );
  END IF;
END $$;

-- Policy: Admins can update files metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update uploads metadata'
  ) THEN
    CREATE POLICY "Admins can update uploads metadata"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'uploads')
    WITH CHECK (bucket_id = 'uploads');
  END IF;
END $$;

-- Create index for faster attachment queries by entity (if not exists)
CREATE INDEX IF NOT EXISTS idx_attachments_entity_lookup 
ON attachments(entity_type, entity_id);

-- Create index for faster attachment queries by creation date (if not exists)
CREATE INDEX IF NOT EXISTS idx_attachments_created_at 
ON attachments(created_at DESC);