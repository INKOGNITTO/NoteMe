package models;

import java.util.*;

import javax.persistence.*;
import play.data.binding.As;
import play.data.validation.*;

import play.db.jpa.Model;


@Entity
@Table (name = "notes")
public class Note extends Model {

    @ManyToOne
    public User owner;    

    @Column(unique = true)
    public String publicID;

    @Column(columnDefinition = "TEXT")
    public String content;

    @ManyToMany
    public List<Tag> tags = new ArrayList<Tag>();
	
    @ManyToOne
    @Required
    public Notebook notebook;

    @Required
    public String name;

    @Temporal(TemporalType.TIMESTAMP)
    @As("dd.MM.yyyy hh:mm:ss")
    public Date creationDate = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @As("dd.MM.yyyy hh:mm:ss")
    public Date updateDate = new Date();

    

    public Note(String name, Long notebookID, Long userID) {
        this.name = name;
        this.notebook = Notebook.findById(notebookID);
        this.owner = User.findById(userID);
        this.creationDate = new Date();
        this.updateDate = new Date();

    }

    public static Note create(String name, Long notebookID, Long userID) {
        Note note = new Note(name, notebookID, userID);
        note.save();
        return note;
    }
    
}
