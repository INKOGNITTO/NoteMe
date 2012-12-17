package models;

import java.util.*;
import javax.persistence.*;
import org.hibernate.annotations.Cascade;
import play.Logger;
import play.data.validation.Required;
import play.db.jpa.JPA;
import play.db.jpa.Model;
import play.mvc.Scope;

@Entity
@Table(name = "notebooks")
public class Notebook extends Model {

    @Required
    public String name;
    
    @ManyToMany(cascade = CascadeType.ALL)
    @Cascade(org.hibernate.annotations.CascadeType.ALL)
    @OrderColumn
    public List<Note> notes = new LinkedList<Note>();
    
    @ManyToOne
    public Notebook linkParent;
   
    @OneToMany (mappedBy = "linkParent")
    public Set<Notebook> linkedNotebooks = new HashSet<Notebook>();
    
    @ManyToOne
    public User owner;

    public Notebook(String name, User user) {
        this.name = name;
        this.owner = user;
    }

    public static Notebook create(String name, Long userID) {
        Notebook notebook = new Notebook(name, User.<User>findById(userID));
         notebook.save();
        return notebook;
    }

    public String rename(String newName) {
        this.name = newName;
        this.save();
        return newName;
    }

    public void addNote(Note note, int position) {
        if(linkParent != null) {
            linkParent.addNote(note, position);
        } else {
            linkNote(note, position);
        }
        save();
    }
    
    public void linkNote(Note note, int position) {
        if (position >= 0) {
            notes.add(position, note);
        } else {
            notes.add(note);
        }
        for (Notebook nb : linkedNotebooks) {
            nb.linkNote(note, position);
            nb.save();
        }
    }

    public void removeNote(Note note) {
        if (note.owner.email.equals(Scope.Session.current.get().get("username"))) {
            if(linkParent != null) {
                linkParent.removeNote(note);
            } else {
                unlinkNote(note);
            }
        } else {
            notes.remove(note);
            if (note.notebooks.isEmpty()){
                note.remove();
            }
        }
        save();
    }
    
    public void unlinkNote(Note note) {
        notes.remove(note);
        for (Notebook nb : linkedNotebooks) {
            nb.unlinkNote(note);
            nb.save();
        }
        if(note.isPersistent() && note.notebooks.isEmpty()) {
            note.remove();
        }
        this.save();
    }

    /**
     * Vsetky poznamky vlastnene prihlasenym pouzivatelom -> odstranit Z
     * poznamok nevlastnenych prihlasenym pouzivatelom odobrat z sharedWith
     * pouzivatela
     */
    public void remove() {
        User actualUser = User.findByEmail(Scope.Session.current.get().get("username"));
        Logger.info("removing notebook from db: "+actualUser.email + ", " + this.name + " " + this.id);
        List<Note> notesToRemove = new ArrayList();
        for (Note note : notes) {
            // ak pouzivatel nie je vlastnik, treba odstranit referenciu User.notOwnedNotes
            if (!note.owner.equals(actualUser)) {
                actualUser.notOwnedNotes.remove(note);
                actualUser.save();
            }
            notesToRemove.add(note);
        }
        // zmaze vsetky poznamky zoznamu do ktoreho sa povkladali poznamky na zmazanie
        for (Note note : notesToRemove) {
            note.remove();
        }
        // odstrani pozn. blok aktualneho pouzivatela
        actualUser.refresh();
        actualUser.notebooks.remove(this);
        this.owner = null;
        actualUser.save();
        this.save();
        this.refresh();
        /* Ak notebook, ktory chce pouzivatel zmazat je defaultny nb
         * t.j. nb do ktoreho sa mu ukladaju poznamky ktore mu vyzdielavaju iny pouzivatelia
         * treba ho odobrat z User.defaultNbSharedNotes
         */
        if (actualUser.defaultNbSharedNotes != null && actualUser.defaultNbSharedNotes.equals(this)) {
            actualUser.defaultNbSharedNotes = null;
            actualUser.save();
        }
        //Query q = JPA.em().createQuery("select notebook from Notebook notebook where :this member of notebook.linkedNotebooks").setParameter("this", this);
        //Notebook originNotebook = (Notebook)q.getSingleResult();
        if (linkParent != null) {
            linkParent.unlinkNotebook(this);
        }
        for (Notebook ntb : linkedNotebooks) {
            this.unlinkNotebook(ntb);
        }
        //originNotebook.unlinkNotebook(this);
        this.refresh();
        if (this.isPersistent()){
        this.delete();}
    }

    public void linkNotebook(Notebook notebook) {
        notebook.linkParent = this;
        for (Note n : notes) {
            notebook.linkNote(n,-1);
        }
        notebook.save();
    }

    public void unlinkNotebook(Notebook notebook) {
        User user = User.findByEmail(Scope.Session.current.get().get("username"));
        notebook.linkParent = null;
        notebook.save();
        List<Note> notesToRemove = new ArrayList();
        for (Note n : notebook.notes) {
            if (n.owner.equals(user)) {
                notesToRemove.add(n);
            }
        }
        for( Note n :notesToRemove) {
            notebook.removeNote(n);
        }
        notebook.save();

        
        notesToRemove.clear();
        for (Note n : this.notes) {
            if(n.owner.equals(notebook.owner) && !n.sharedWith.contains(this.owner)) {
                Logger.info("remove "+n.id);
                notesToRemove.add(n);
                
            }
        }
        for( Note n :notesToRemove) {
            this.removeNote(n);
        }
        
        notebook.refresh();
        if(notebook.notes.isEmpty() && notebook.owner!=null){ // ak je notebook prazdny a este ma vlastnika (teda unlink nebezi v ramci mazanie notebook-u)
            User nbOwner = notebook.owner;
            notebook.owner = null;
            nbOwner.notebooks.remove(notebook);
            nbOwner.save();
            notebook.remove();

        }
        
        this.save();
    }
    
    public Set<Notebook> getLinkedTree(){
        if (linkParent != null) {
            return linkParent.getLinkedTree();
        } else {
            return this.getLinkedList();
        }
    }
    
    public Set<User> getLinkedTreeOwners(){
        Set<Notebook> nbtree = getLinkedTree();
        Set<User> owners = new HashSet();
        for(Notebook nb : nbtree) {
            owners.add(nb.owner);
        }
        return owners;
    }
    
    private Set<Notebook> getLinkedList() {
        Set<Notebook> ll = new HashSet();
        ll.add(this);
        for (Notebook nb : linkedNotebooks) {
            ll.addAll(nb.getLinkedList());
        }
        return ll;
    }
    
    public Set<Notebook> getLinkedTreeButDirectLinked(){
        Set<Notebook> set = getLinkedTree();
        set.removeAll(linkedNotebooks);
        set.remove(this);
        return set;
    }
    
    @Override
    public String toString(){
        return this.name;
    }
        
}
