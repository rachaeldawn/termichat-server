import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.type';

@Injectable()
export class UserService {
  // client's id to an object
  private users: Map<string, User>;

  public add(clientId: string, obj: User): any {
    this.users.set(clientId, obj);
  }

  public remove(clientId: string): void {
    this.users.delete(clientId);
  }

  public removeInactive(threshold: number): string[] {
    const removedIds = [];

    for (const [clientId, user] of this.users.entries()) {
      if (Date.now() - user.seen > threshold) {
        this.remove(clientId);
      }
      removedIds.push(clientId);
    }

    return removedIds;
  }

  public rename(clientId: string, newName: string): void {
    const user = this.users.get(clientId);
    if (user == null) {
      throw new NotFoundException();
    }

    user.name = newName;
    this.add(clientId, user);
  }

  public updatePresence(clientId: string): void {
    const user = this.users.get(clientId);
    if (user == null) {
      throw new NotFoundException();
    }

    user.seen = Date.now();
    this.add(clientId, user);
  }
}
