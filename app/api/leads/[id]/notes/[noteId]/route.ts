/**
 * PATCH /api/leads/[id]/notes/[noteId] - Update note
 * DELETE /api/leads/[id]/notes/[noteId] - Delete note
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateNoteContent } from '@/lib/lead-management/notes';
import { z } from 'zod';

const updateNoteSchema = z.object({
  content: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, noteId } = await params;
    const userId = (session.user as { id?: string }).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateNoteSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Validate note content
    try {
      validateNoteContent(content);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid note content' },
        { status: 400 }
      );
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify note exists and belongs to lead
    const note = await prisma.leadNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        leadId: true,
        userId: true,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (note.leadId !== id) {
      return NextResponse.json(
        { error: 'Note does not belong to this lead' },
        { status: 400 }
      );
    }

    // Check permission: only author can edit
    if (note.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own notes' },
        { status: 403 }
      );
    }

    // Update note
    const updatedNote = await prisma.leadNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        note: {
          id: updatedNote.id,
          content: updatedNote.content,
          updatedAt: updatedNote.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to update note', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, noteId } = await params;
    const userId = (session.user as { id?: string }).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify note exists and belongs to lead
    const note = await prisma.leadNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        leadId: true,
        userId: true,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (note.leadId !== id) {
      return NextResponse.json(
        { error: 'Note does not belong to this lead' },
        { status: 400 }
      );
    }

    // Check permission: only author can delete
    if (note.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own notes' },
        { status: 403 }
      );
    }

    // Delete note
    await prisma.leadNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to delete note', details: errorMessage },
      { status: 500 }
    );
  }
}
